"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Brain, Bot, Zap, Activity } from "lucide-react";

const NAV = [
  { href: "/",          label: "Dashboard",    icon: LayoutDashboard },
  { href: "/claims",    label: "Claims",       icon: Search },
  { href: "/patterns",  label: "Patterns",     icon: Brain },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/generator", label: "Generator",    icon: Zap },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #21262d" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1f3a5f", border: "1px solid #2a4a72", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Activity size={16} color="#58a6ff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3", lineHeight: 1.2 }}>ClaimSense</div>
            <div style={{ fontSize: 11, color: "#58a6ff", lineHeight: 1.2 }}>AI Platform</div>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div style={{ margin: "12px 12px 4px", padding: "8px 10px", background: "#0d1117", border: "1px solid #21262d", borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#3fb950", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#3fb950", fontWeight: 500 }}>AI Engine Online</span>
        </div>
        <div style={{ fontSize: 11, color: "#484f58" }}>Groq · gpt-oss-20b</div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "8px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div className={`nav-item${active ? " active" : ""}`}>
                <Icon size={15} style={{ flexShrink: 0 }} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid #21262d" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1f6feb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 700, color: "white" }}>A</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", lineHeight: 1.3 }}>Aryan Gupta</div>
            <div style={{ fontSize: 11, color: "#484f58", lineHeight: 1.3 }}>aryan.gupta@claimsense.ai</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
