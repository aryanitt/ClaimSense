# ClaimSense AI

**ClaimSense AI** is an advanced, AI-powered healthcare Revenue Cycle Management (RCM) platform designed to tackle one of the healthcare industry's most expensive problems: insurance claim denials.

Every year, healthcare providers lose billions of dollars to denied claims due to complex payer rules, timely filing limits, missing prior authorizations, and coding errors. ClaimSense AI automates the analysis of Electronic Data Interchange (EDI) records (835 Remittance Advice and 837 Claim Submissions), interprets standardized CARC/RARC codes, and uses high-performance AI inference to generate actionable recovery strategies.

## 🚀 Key Features

*   **EDI Data Engine:** Natively parses and aligns EDI 835 (Remittance) and EDI 837 (Submission) schemas to create a complete lifecycle view of every claim.
*   **AI Root Cause Analysis:** Integrates the **Groq API** (running `openai/gpt-oss-20b`) to instantly interpret complex denials, providing human-readable explanations and appeal strategies.
*   **Denial Pattern Intelligence:** Uses algorithmic clustering to map denials across multiple dimensions (Payer, CARC code, CPT code) to help billing teams prioritize high-value recovery opportunities.
*   **Timely Filing Validation:** Automatically calculates filing gaps against specific payer limits (e.g., Medicare vs. Commercial) to flag unrecoverable claims.
*   **Prior Authorization Checking:** Verifies the presence of required authorization markers in the EDI 837 payload.
*   **Synthetic Claim Generator:** A built-in PRNG-seeded engine capable of generating realistic, structured EDI claim data with accurate denial probability distributions for testing and QA.

## 🛠️ Technology Stack

*   **Frontend:** Next.js 15 (App Router), React, TypeScript
*   **Styling:** Vanilla CSS (Custom clean, GitHub-style dark UI system)
*   **Charts & Visualization:** Recharts (Area, Bar, Radar, Scatter)
*   **Icons:** Lucide React
*   **AI Inference Engine:** Groq API (`openai/gpt-oss-20b`) via Server-Sent Events (SSE) streaming

## 📂 Architecture & Navigation

*   `/` **Dashboard**: High-level KPI overview, denial trends, payer breakdown, and AI insights.
*   `/claims`: **Claim Explorer**: Searchable, filterable table of all processed claims.
*   `/claims/[id]`: **Claim Detail**: Side-by-side EDI 835/837 comparison, AI analysis verdict, timeline, and similar historical claims matching.
*   `/patterns`: **Pattern Intelligence**: High-density cluster analysis, payer radar comparisons, and month-over-month heatmaps.
*   `/assistant`: **AI Assistant**: A modern, streaming LLM chat interface fine-tuned on CARC/RARC rules and medical billing intelligence.
*   `/generator`: **Data Generator**: Tooling to simulate claims data and export to JSON/CSV.

## ⚙️ Local Development

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/aryanitt/ClaimSense.git
   cd ClaimSense
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure Environment Variables:**
   Create a \`.env.local\` file in the root directory and add your Groq API key:
   \`\`\`env
   GROQ_API_KEY=your_groq_api_key_here
   \`\`\`

4. **Run the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏥 Context: What are CARC and RARC?
*   **CARC (Claim Adjustment Reason Code):** Standardized codes used by payers to explain why a claim was denied or adjusted (e.g., CARC 29: Time limit for filing has expired).
*   **RARC (Remittance Advice Remark Code):** Supplemental codes that provide additional, specific explanation for an adjustment.

*Built for modern medical billing teams to stop revenue leakage.*
