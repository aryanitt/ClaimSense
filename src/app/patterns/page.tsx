"use client";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, Legend, BarChart, Bar
} from "recharts";
import { ALL_CLAIMS, clusterDenials, getDenialsByPayer } from "@/lib/mockData";
import { CARC_REFERENCE } from "@/lib/ediTypes";

const COLORS = ["#58a6ff", "#3fb950", "#f85149", "#d2a8ff", "#ffa657", "#79c0ff", "#56d364", "#ff7b72"];

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const ChartTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ color: "#58a6ff", fontWeight: 600, marginBottom: 4 }}>CARC {d?.carcCode} — {d?.payer?.split(" ")[0]}</p>
      <p style={{ color: "#8b949e" }}>Claims: <span style={{ color: "#e6edf3" }}>{d?.count}</span></p>
      <p style={{ color: "#8b949e" }}>Denied: <span style={{ color: "#f85149" }}>{fmt$(d?.totalDenied)}</span></p>
      <p style={{ color: "#8b949e" }}>Recovery: <span style={{ color: "#3fb950" }}>{d?.recoveryRate}%</span></p>
    </div>
  );
};

export default function PatternsPage() {
  const clusters   = clusterDenials(ALL_CLAIMS);
  const highValue  = clusters.filter(c => c.recoveryRate >= 55).sort((a, b) => b.totalDenied - a.totalDenied).slice(0, 5);
  const scatterData = clusters.map(c => ({ ...c, x: c.count, y: c.recoveryRate }));

  // Radar — seeded values per payer
  const radarPayers = ["BCBS", "Aetna", "United", "Medicare", "Cigna"];
  const radarValues = [
    [72, 45, 38, 55, 60],
    [58, 68, 42, 70, 55],
    [30, 25, 48, 20, 35],
    [35, 40, 28, 42, 38],
    [50, 55, 62, 48, 52],
  ];
  const radarData = ["Denial Rate","Recovery Rate","Avg Days Filed","Prior Auth %","Complexity"].map((metric, i) => {
    const row: any = { metric };
    radarPayers.forEach((p, j) => { row[p] = radarValues[i][j]; });
    return row;
  });

  // Heatmap
  const months   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const heatPayers = ["BCBS", "Aetna", "UHC", "Cigna", "Medicare"];
  const heatVals = [
    [22, 26, 5, 27, 21, 30, 25, 5, 16, 21, 11, 8],
    [3, 31, 28, 31, 24, 38, 28, 2, 31, 18, 19, 14],
    [4, 4, 25, 13, 17, 12, 25, 29, 11, 28, 17, 9],
    [26, 25, 6, 15, 15, 21, 29, 20, 11, 22, 3, 7],
    [2, 9, 5, 29, 14, 21, 12, 14, 23, 4, 21, 6],
  ];

  const totalDenied      = clusters.reduce((s, c) => s + c.totalDenied, 0);
  const recoverableValue = highValue.reduce((s, c) => s + c.totalDenied * c.recoveryRate / 100, 0);
  const avgRecovery      = clusters.length ? Math.round(clusters.reduce((s, c) => s + c.recoveryRate, 0) / clusters.length) : 0;

  const stats = [
    { label: "Total Clusters",         value: String(clusters.length),   color: "#58a6ff" },
    { label: "High-Value Clusters",    value: String(highValue.length),   color: "#3fb950" },
    { label: "Recoverable Opportunity",value: fmt$(recoverableValue),     color: "#ffa657" },
    { label: "Avg Recovery Rate",      value: `${avgRecovery}%`,          color: "#d2a8ff" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pattern Intelligence</h1>
        <p className="page-desc">Denial clustering, payer analysis, and batch recovery intelligence</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} className="card kpi-card">
            <p className="kpi-label">{s.label}</p>
            <p className="kpi-value" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        {/* Scatter */}
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title">Denial Cluster Map</p>
          <p className="section-sub">X = # claims · Y = avg recovery % · bubble = denied $</p>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 8, right: 16, left: -10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis type="number" dataKey="x" name="Claims" tick={{ fill: "#6e7681", fontSize: 11 }} axisLine={false} tickLine={false}
                label={{ value: "# Claims", position: "insideBottom", offset: -4, fill: "#484f58", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Recovery %" tick={{ fill: "#6e7681", fontSize: 11 }} axisLine={false} tickLine={false}
                label={{ value: "Recovery %", angle: -90, position: "insideLeft", offset: 10, fill: "#484f58", fontSize: 11 }} />
              <Tooltip content={<ChartTip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatterData}>
                {scatterData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.8} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title">Payer Intelligence Radar</p>
          <p className="section-sub">Comparative payer behavior across key RCM dimensions</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 8, right: 20, left: 20, bottom: 8 }}>
              <PolarGrid stroke="#21262d" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#6e7681", fontSize: 10 }} />
              {radarPayers.slice(0, 4).map((p, i) => (
                <Radar key={p} name={p} dataKey={p} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.07} strokeWidth={1.5} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, color: "#8b949e", paddingTop: 4 }} />
              <Tooltip contentStyle={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-value clusters + Heatmap */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        {/* High value */}
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title">High-Value Recovery Clusters</p>
          <p className="section-sub">Clusters with &gt;55% average recovery probability</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {highValue.length === 0 && (
              <p style={{ fontSize: 13, color: "#484f58", textAlign: "center", padding: "24px 0" }}>No high-value clusters found</p>
            )}
            {highValue.map((c, i) => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#0d1117", border: "1px solid #21262d", borderRadius: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: `${COLORS[i]}18`, border: `1px solid ${COLORS[i]}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS[i], flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-carc mono" style={{ fontSize: 10 }}>CARC {c.carcCode}</span>
                    <span style={{ fontSize: 11, color: "#8b949e" }}>{c.payer.split(" ").slice(0, 2).join(" ")} · {c.count} claims</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#484f58", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {CARC_REFERENCE[c.carcCode]?.description?.slice(0, 52)}…
                  </p>
                  <div style={{ height: 4, background: "#21262d", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${c.recoveryRate}%`, background: COLORS[i], borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#3fb950" }}>{c.recoveryRate}%</p>
                  <p style={{ fontSize: 11, color: "#6e7681" }}>{fmt$(c.totalDenied)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title">Denial Heatmap — Payer × Month</p>
          <p className="section-sub">Denial frequency (darker = more denials)</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "4px 8px 8px 0", fontSize: 10, color: "#6e7681", fontWeight: 600, width: 64 }}>Payer</th>
                  {months.map(m => (
                    <th key={m} style={{ padding: "4px 2px 8px", fontSize: 10, color: "#6e7681", fontWeight: 600, textAlign: "center", width: 32 }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatPayers.map((payer, ri) => {
                  const rowMax = Math.max(...heatVals[ri]);
                  return (
                    <tr key={ri}>
                      <td style={{ padding: "3px 8px 3px 0", fontSize: 11, color: "#8b949e", fontWeight: 500, whiteSpace: "nowrap" }}>{payer}</td>
                      {heatVals[ri].map((v, ci) => {
                        const intensity = v / rowMax;
                        return (
                          <td key={ci} style={{ padding: "3px 2px" }}>
                            <div
                              title={`${payer} ${months[ci]}: ${v}`}
                              style={{
                                width: 28, height: 24, borderRadius: 4,
                                background: `rgba(88,166,255,${0.08 + intensity * 0.72})`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, fontWeight: 600,
                                color: intensity > 0.5 ? "#e6edf3" : "#6e7681",
                                cursor: "default",
                              }}
                            >
                              {v}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cluster intelligence table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #21262d" }}>
          <p className="section-title" style={{ marginBottom: 2 }}>Denial Cluster Intelligence Report</p>
          <p style={{ fontSize: 12, color: "#8b949e" }}>All clusters sorted by total denied amount — use for billing team prioritization</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>CARC</th>
                <th>Category</th>
                <th>Payer</th>
                <th>Claims</th>
                <th>Total Denied</th>
                <th>Avg Recovery</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {clusters.slice(0, 10).map((c, i) => {
                const priority = c.totalDenied > 20000 && c.recoveryRate > 55 ? { label: "High",   color: "#f85149" }
                               : c.totalDenied > 5000                         ? { label: "Medium", color: "#ffa657" }
                               :                                                 { label: "Low",    color: "#3fb950" };
                return (
                  <tr key={`${c.key}-${i}`}>
                    <td><span className="badge badge-carc mono">{c.carcCode}</span></td>
                    <td style={{ color: "#8b949e" }}>{CARC_REFERENCE[c.carcCode]?.category ?? "Other"}</td>
                    <td>{c.payer.split(" ").slice(0, 2).join(" ")}</td>
                    <td style={{ fontWeight: 600 }}>{c.count}</td>
                    <td style={{ color: "#f85149", fontWeight: 600 }}>{fmt$(c.totalDenied)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 4, background: "#21262d", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ height: "100%", width: `${c.recoveryRate}%`, background: "#3fb950", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#3fb950" }}>{c.recoveryRate}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, color: priority.color }}>
                        ● {priority.label}
                      </span>
                    </td>
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
