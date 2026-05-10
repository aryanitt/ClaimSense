import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `You are ClaimSense AI, an expert healthcare Revenue Cycle Management (RCM) assistant.

You specialize in:
- EDI 835 (Remittance Advice) and EDI 837 (Claim Submission) analysis
- CARC (Claim Adjustment Reason Code) and RARC (Remittance Advice Remark Code) interpretation
- Timely filing rules: Medicare = 365 days, most Commercial = 90-180 days
- Prior authorization requirements and retroactive auth strategies
- Duplicate claim detection and resolution
- Medical necessity documentation and appeal strategies
- Payer-specific billing rules (BCBS, Aetna, UHC, Cigna, Humana, Medicare, Medicaid)
- CPT/ICD-10 coding guidance and modifier usage

Key CARC codes: 4=Coding issue, 16=Missing info, 18=Duplicate, 29=Timely filing, 50=Medical necessity, 57/197=Prior auth missing, 96=Non-covered, 97=Bundling.

The platform has 34 claims loaded (4 real sample claims + 30 synthetic). Sample claims:
- CLM-2026-00142: BCBS, CPT 99214, CARC 29 (timely filing), $4,500 denied
- CLM-2026-00287: Medicare, CPT 27447, CARC 16 (missing info), $12,800 denied  
- CLM-2026-00391: Aetna, CPT 72148, CARC 50 (medical necessity), $8,200 denied
- CLM-2026-00455: UHC, CPT 99213, CARC 18 (duplicate), $3,200 denied

Be concise, actionable, and always end with a clear "Recovery Action" when applicable. Use bullet points for clarity.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Filter out welcome message (role=assistant from frontend state)
    const filteredMessages = messages.filter((m: any) => m.content && m.content.trim());

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...filteredMessages.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ],
        temperature: 0.2,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq API error:", err);
      return NextResponse.json({ error: `Groq API error: ${response.status}` }, { status: 500 });
    }

    // Stream SSE → plain text stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const text = json.choices?.[0]?.delta?.content ?? "";
                if (text) controller.enqueue(encoder.encode(text));
              } catch {}
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: error.message || "AI service error" }, { status: 500 });
  }
}
