"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RotateCcw, Loader2, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: `Hi there. I'm ClaimSense AI.

I'm ready to help you analyze claim denials, interpret CARC/RARC codes, and develop appeal strategies.

**Sample claims loaded in this session:**
• CLM-2026-00142 — BCBS, CPT 99214, CARC 29 (Timely Filing), $4,500
• CLM-2026-00287 — Medicare, CPT 27447, CARC 16 (Missing Info), $12,800
• CLM-2026-00391 — Aetna, CPT 72148, CARC 50 (Medical Necessity), $8,200
• CLM-2026-00455 — UHC, CPT 99213, CARC 18 (Duplicate), $3,200

How can I help you today?`,
};

const SUGGESTIONS = [
  "Why was CLM-2026-00142 denied and is it recoverable?",
  "What is CARC 50 and how do I appeal it?",
  "How do I handle a duplicate claim denial (CARC 18)?",
  "What's the timely filing limit for Medicare?",
];

function parseMarkdown(text: string) {
  // Simple markdown-lite parser for bold and lists
  return text.split('\n').map((line, i) => {
    let parsedLine = line;
    // Bold
    parsedLine = parsedLine.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #e6edf3; font-weight: 600;">$1</strong>');
    
    if (parsedLine.trim() === '') {
      return <div key={i} style={{ height: 12 }} />;
    }
    
    if (parsedLine.startsWith('• ') || parsedLine.startsWith('- ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <span style={{ color: '#58a6ff' }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: parsedLine.substring(2) }} />
        </div>
      );
    }

    return <p key={i} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: parsedLine }} />;
  });
}

function MessageContent({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 14, color: "#c9d1d9", lineHeight: 1.6, wordBreak: "break-word" }}>
      {parseMarkdown(text)}
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [stream, setStream]     = useState("");
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stream]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setStream("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStream(full);
      }

      setMessages(prev => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: full },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Error connecting to AI: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
      setStream("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 56px)",
      maxWidth: 900,
      margin: "0 auto",
      position: "relative"
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 0 24px 0",
        borderBottom: "1px solid #21262d",
        marginBottom: 24,
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e6edf3", marginBottom: 4 }}>AI Assistant</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={12} color="#58a6ff" />
            <span style={{ fontSize: 12, color: "#8b949e" }}>Powered by Groq • openai/gpt-oss-20b</span>
          </div>
        </div>
        <button
          onClick={() => { setMessages([WELCOME]); setStream(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 6,
            background: "transparent", border: "1px solid #30363d",
            cursor: "pointer", color: "#8b949e", fontSize: 12, fontWeight: 500,
            transition: "all 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#58a6ff"; e.currentTarget.style.color = "#c9d1d9"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#30363d"; e.currentTarget.style.color = "#8b949e"; }}
        >
          <RotateCcw size={12} />
          New Chat
        </button>
      </div>

      {/* ── Messages Stream ────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        paddingBottom: 40,
        scrollBehavior: "smooth"
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", gap: 20 }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {msg.role === "assistant" ? (
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "#0d1117", border: "1px solid #30363d",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Bot size={16} color="#58a6ff" />
                </div>
              ) : (
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "#1f6feb",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <User size={16} color="white" />
                </div>
              )}
            </div>

            {/* Message Body */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", marginBottom: 6 }}>
                {msg.role === "assistant" ? "ClaimSense AI" : "You"}
              </div>
              <MessageContent text={msg.content} />
            </div>
          </div>
        ))}

        {/* Streaming Placeholder */}
        {loading && (
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#0d1117", border: "1px solid #30363d",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Bot size={16} color="#58a6ff" />
              </div>
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", marginBottom: 6 }}>ClaimSense AI</div>
              {stream ? (
                <div style={{ fontSize: 14, color: "#c9d1d9", lineHeight: 1.6, wordBreak: "break-word" }}>
                  {parseMarkdown(stream)}
                  <span className="pulse" style={{ display: "inline-block", width: 4, height: 14, background: "#58a6ff", marginLeft: 4, verticalAlign: "middle" }} />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, height: 22 }}>
                  <Loader2 size={14} color="#8b949e" className="spin" />
                  <span style={{ fontSize: 13, color: "#8b949e" }}>Thinking...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty div for scrolling */}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* ── Input Area ─────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        paddingTop: 16,
        background: "linear-gradient(180deg, rgba(13,17,23,0) 0%, #0d1117 20%)",
      }}>
        {showSuggestions && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)}
                style={{
                  padding: "8px 14px",
                  background: "#161b22", border: "1px solid #30363d",
                  borderRadius: 20, fontSize: 12, color: "#c9d1d9",
                  cursor: "pointer", transition: "all 0.15s",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#58a6ff"; e.currentTarget.style.color = "#e6edf3"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#30363d"; e.currentTarget.style.color = "#c9d1d9"; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          padding: "12px 16px",
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ClaimSense AI..."
            rows={1}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 14,
              color: "#e6edf3",
              fontFamily: "inherit",
              lineHeight: 1.5,
              maxHeight: 200,
              padding: "4px 0",
              overflowY: "auto",
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              background: input.trim() && !loading ? "#e6edf3" : "#30363d",
              color: input.trim() && !loading ? "#0d1117" : "#8b949e",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#6e7681", marginTop: 12 }}>
          ClaimSense AI can make mistakes. Consider verifying important RCM information.
        </p>
      </div>
    </div>
  );
}
