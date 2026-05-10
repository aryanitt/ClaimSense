"use client";
import { Bell, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "RCM overview — denial KPIs, trends, and AI insights" },
  "/claims": { title: "Claim Explorer", subtitle: "Search and analyze 835/837 EDI claim data" },
  "/patterns": { title: "Pattern Intelligence", subtitle: "Denial clustering, payer analysis, batch recovery intelligence" },
  "/assistant": { title: "AI Assistant", subtitle: "Powered by Groq · openai/gpt-oss-20b" },
  "/generator": { title: "Synthetic Claim Generator", subtitle: "Generate EDI 835/837 test data with CARC codes" },
};

export function TopBar() {
  const pathname = usePathname();
  const [notifications] = useState(3);
  const page = PAGE_TITLES[pathname] || PAGE_TITLES["/"];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
      style={{
        background: "rgba(3, 7, 18, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(6, 182, 212, 0.08)",
      }}
    >
      <div>
        <h1 className="text-lg font-bold text-white">{page.title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500"
          style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(6,182,212,0.1)" }}>
          <Search className="w-4 h-4" />
          <span className="text-xs">Quick search...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500 font-mono">⌘K</kbd>
        </div>

        {/* AI badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}>
          <Sparkles className="w-3 h-3" />
          AI Active
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(6,182,212,0.15)" }}>
          <Bell className="w-4 h-4 text-slate-400" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-bold text-black flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:scale-105 transition-all">
          RD
        </div>
      </div>
    </motion.header>
  );
}
