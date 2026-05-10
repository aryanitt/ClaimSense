"use client";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  ALL_CLAIMS, getDashboardStats, getDenialsByPayer,
  getDenialsByCARC, getMonthlyTrend, CLAIM_ANALYSES
} from "@/lib/mockData";
import { CARC_REFERENCE } from "@/lib/ediTypes";

const COLORS = ["#58a6ff", "#3fb950", "#f85149", "#d2a8ff", "#ffa657", "#79c0ff", "#56d364"];

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ color: "#8b949e", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const stats = getDashboardStats();
  const payerData = getDenialsByPayer().slice(0, 6);
  const carcData = getDenialsByCARC().slice(0, 5);
  const trend = getMonthlyTrend();
  const recentDenied = ALL_CLAIMS.filter(c => c.edi835.pc_ClaimStatus === "4").slice(0, 8);

  const kpis = [
    { label: "Total Denied",    value: fmt$(stats.totalDenied),       sub: `${stats.deniedCount} claims`,       color: "#f85149" },
    { label: "Recoverable",     value: fmt$(stats.recoverableAmount),  sub: `${stats.recoverableCount} claims`,  color: "#3fb950" },
    { label: "Denial Rate",     value: `${stats.denialRate.toFixed(1)}%`, sub: "of all claims",               color: "#ffa657" },
    { label: "AI Confidence",   value: `${stats.avgConfidence.toFixed(0)}%`, sub: "avg score",                color: "#58a6ff" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-desc">Revenue Cycle Management — Denial Intelligence Overview</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} className="card kpi-card">
            <p className="kpi-label">{k.label}</p>
            <p className="kpi-value" style={{ color: k.color }}>{k.value}</p>
            <p className="kpi-sub">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title">Denial & Recovery Trend</p>
          <p className="section-sub">Monthly volume over 12 months</p>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f85149" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f85149" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3fb950" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3fb950" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="month" tick={{ fill: "#6e7681", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6e7681", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="denials"   name="Denials"   stroke="#f85149" strokeWidth={2} fill="url(#dg)" />
              <Area type="monotone" dataKey="recovered" name="Recovered" stroke="#3fb950" strokeWidth={2} fill="url(#rg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <p className="section-title">Denials by Payer</p>
          <p className="section-sub">Total denied $ per carrier</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={payerData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis dataKey="payer" tick={{ fill: "#6e7681", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v.split(" ")[0]} />
              <YAxis tick={{ fill: "#6e7681", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="amount" name="Denied $" radius={[4, 4, 0, 0]}>
                {payerData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14 }}>

        {/* AI Insights */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#3fb950", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>AI Insights</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { e: "🔴", t: `CARC ${carcData[0]?.code || "29"} is top denial reason (${carcData[0]?.count || 0} claims)` },
              { e: "🟢", t: `${fmt$(stats.recoverableAmount)} in recoverable revenue identified` },
              { e: "🟡", t: `${stats.deniedCount} claims denied totaling ${fmt$(stats.totalDenied)}` },
              { e: "🔵", t: `Avg AI confidence: ${stats.avgConfidence.toFixed(0)}% across analyses` },
              { e: "⚡", t: `Prior auth denials average 65% recovery with timely appeal` },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 10px", background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{item.e}</span>
                <p style={{ fontSize: 12, color: "#c9d1d9", lineHeight: 1.5 }}>{item.t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Claims */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #21262d" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>Recent Denied Claims</span>
            <Link href="/claims" style={{ fontSize: 12, color: "#58a6ff", textDecoration: "none" }}>View all →</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Payer</th>
                <th>CPT</th>
                <th>Denied $</th>
                <th>CARC</th>
                <th>Category</th>
                <th>Recovery</th>
              </tr>
            </thead>
            <tbody>
              {recentDenied.map(c => {
                const analysis = CLAIM_ANALYSES.get(c.edi835.pc_ClaimID);
                const carc = c.edi835.pcla_AdjustmentReason;
                const color = analysis?.recoverabilityVerdict === "recoverable" ? "#3fb950"
                  : analysis?.recoverabilityVerdict === "not_recoverable" ? "#f85149" : "#ffa657";
                return (
                  <tr key={c.edi835.pc_ClaimID}>
                    <td>
                      <Link href={`/claims/${c.edi835.pc_ClaimID}`} className="mono"
                        style={{ color: "#58a6ff", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>
                        {c.edi835.pc_ClaimID}
                      </Link>
                    </td>
                    <td style={{ color: "#8b949e" }}>{c.edi835.cp_PayerName.split(" ")[0]}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{c.edi835.pcl_ProcedureCode}</td>
                    <td style={{ color: "#f85149", fontWeight: 600 }}>{fmt$(c.edi835.pcla_AdjustmentAmount)}</td>
                    <td><span className="badge badge-carc mono">{carc}</span></td>
                    <td style={{ color: "#8b949e", fontSize: 12 }}>{CARC_REFERENCE[carc]?.category ?? "Other"}</td>
                    <td style={{ color, fontWeight: 600, fontSize: 12 }}>{analysis?.recoverabilityScore ?? 0}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
