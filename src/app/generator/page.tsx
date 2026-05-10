"use client";
import { useState } from "react";
import { Zap, Download, RefreshCw } from "lucide-react";
import { CARC_REFERENCE } from "@/lib/ediTypes";

const PAYERS = [
  { name: "Blue Cross Blue Shield", id: "BCBS-IL",   type: "Commercial", limit: 180 },
  { name: "Aetna",                  id: "AETNA-01",  type: "Commercial", limit: 180 },
  { name: "United Healthcare",      id: "UHC-01",    type: "Commercial", limit: 90 },
  { name: "Cigna",                  id: "CIGNA-01",  type: "Commercial", limit: 180 },
  { name: "Medicare Part B",        id: "MEDICARE",  type: "Medicare",   limit: 365 },
  { name: "Humana",                 id: "HUMANA-01", type: "Commercial", limit: 180 },
];
const CPT   = ["99213","99214","99215","27447","72148","70553","93000","45378","64483","80053"];
const ICD   = ["M54.5","I10","E11.9","J06.9","M17.11","J20.9","G43.909","K21.0","R07.9"];
const CARCS = Object.keys(CARC_REFERENCE);
const PLACES= ["11 - Office","22 - Outpatient Hospital","21 - Inpatient Hospital","23 - Emergency Room"];

let _s = 99;
function sr() { _s = (_s * 1664525 + 1013904223) & 0xffffffff; return (_s >>> 0) / 0xffffffff; }
function ri(a: number, b: number) { return Math.floor(sr() * (b - a + 1)) + a; }
function rp<T>(arr: T[]): T { return arr[Math.floor(sr() * arr.length)]; }

interface GenConfig { count: number; payer: string; deniedPct: number; minAmt: number; maxAmt: number; }

function generateClaims(cfg: GenConfig) {
  _s = 99; // reset seed so UI hydrates identically
  const defaultPayer = PAYERS.find(p => p.name === cfg.payer);
  
  return Array.from({ length: cfg.count }, (_, i) => {
    const payer       = defaultPayer ?? PAYERS[Math.floor(Math.random() * PAYERS.length)];
    const isDenied    = sr() < cfg.deniedPct / 100;
    const billed      = ri(cfg.minAmt, cfg.maxAmt);
    const paid        = isDenied ? 0 : Math.floor(billed * 0.78);
    const carc        = isDenied ? rp(CARCS) : "45";
    const serviceDate = `2025-${String(ri(1, 12)).padStart(2, "0")}-${String(ri(1, 28)).padStart(2, "0")}`;
    const daysGap     = ri(5, payer.limit + 60);
    const recvDate    = new Date(new Date(serviceDate).getTime() + daysGap * 86400000).toISOString().split("T")[0];
    const claimId     = `GEN-${String(i + 1).padStart(4, "0")}`;
    const cpt         = rp(CPT);
    const icd         = rp(ICD);
    const hasAuth     = sr() > 0.45;

    return {
      edi835: {
        pc_ClaimID: claimId,
        pc_ClaimStatus: isDenied ? "4" : "1",
        cp_PayerName: payer.name,
        cp_PayerID: payer.id,
        pc_InsuranceType: payer.type,
        pc_ClaimAmount: billed,
        pc_ClaimPaid: paid,
        pc_ReceivedDate: recvDate,
        pc_StatementBegin: serviceDate,
        pcl_ProcedureCode: cpt,
        pcl_ChargedAmount: billed,
        pcl_PaidAmount: paid,
        pcl_RemarkCodes: isDenied ? rp(["N20", "N386", "N4", "M51", ""]) : "",
        pcla_AdjustmentGroup: "CO",
        pcla_AdjustmentReason: carc,
        pcla_AdjustmentAmount: billed - paid,
      },
      edi837: {
        ec_ClaimNo: claimId,
        ec_PayerName: payer.name,
        ec_PayerID: payer.id,
        ec_InsuranceType: payer.type,
        ec_Amount: billed,
        ec_PrincipalDiagnosis: icd,
        ec_ServiceDateFrom: serviceDate,
        ec_BillProvNPI: String(ri(1000000000, 1999999999)),
        ec_PriorAuthorization: hasAuth ? `AUTH-${ri(100000, 999999)}` : "",
        ec_ClaimFrequency: "1",
        ec_PlaceOfService: rp(PLACES),
        cd_ProcedureCode: cpt,
        cd_Amount: billed,
        cd_Quantity: 1,
      },
      _meta: {
        denied: isDenied,
        carc_category: CARC_REFERENCE[carc]?.category ?? "Other",
        carc_desc: CARC_REFERENCE[carc]?.description ?? "",
        recovery_pct: isDenied ? CARC_REFERENCE[carc]?.typicalRecovery ?? 40 : 0,
      }
    };
  });
}

function fmt$(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }

export default function GeneratorPage() {
  const [cfg, setCfg]         = useState<GenConfig>({ count: 20, payer: "", deniedPct: 60, minAmt: 500, maxAmt: 15000 });
  const [results, setResults] = useState<ReturnType<typeof generateClaims>>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setResults(generateClaims(cfg));
    setLoading(false);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "synthetic_claims_edi.json"; a.click();
  };

  const exportCSV = () => {
    if (!results.length) return;
    const rows = results.map(r => ({
      claim_id: r.edi835.pc_ClaimID,
      payer: r.edi835.cp_PayerName,
      status: r.edi835.pc_ClaimStatus === "4" ? "denied" : "paid",
      cpt: r.edi835.pcl_ProcedureCode,
      icd10: r.edi837.ec_PrincipalDiagnosis,
      billed: r.edi835.pc_ClaimAmount,
      paid: r.edi835.pc_ClaimPaid,
      denied: r.edi835.pcla_AdjustmentAmount,
      carc: r.edi835.pcla_AdjustmentReason,
      category: r._meta.carc_category,
      recovery_pct: r._meta.recovery_pct,
      service_date: r.edi837.ec_ServiceDateFrom,
      received_date: r.edi835.pc_ReceivedDate,
      prior_auth: r.edi837.ec_PriorAuthorization,
    }));
    const keys = Object.keys(rows[0]) as (keyof typeof rows[0])[];
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${r[k]}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "synthetic_claims.csv"; a.click();
  };

  const deniedCount = results.filter(r => r._meta.denied).length;
  const paidCount   = results.length - deniedCount;
  const totalDeniedAmt = results.reduce((s, r) => s + r.edi835.pcla_AdjustmentAmount, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Synthetic Claim Generator</h1>
        <p className="page-desc">Generate robust EDI 835/837 test data with realistic CARC distributions</p>
      </div>

      {/* Configuration */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <p className="section-title">Generator Configuration</p>
        <p className="section-sub">Tweak distribution parameters for the mock data engine</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
          {/* Claim Count */}
          <div>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6e7681", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Claim Count 
              <span style={{ color: "#58a6ff" }}>{cfg.count}</span>
            </label>
            <input type="range" min={5} max={100} value={cfg.count}
              onChange={e => setCfg(c => ({ ...c, count: +e.target.value }))}
              style={{ width: "100%", accentColor: "#1f6feb", cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#484f58", marginTop: 6 }}>
              <span>5</span><span>100</span>
            </div>
          </div>

          {/* Denial Rate */}
          <div>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6e7681", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Target Denial Rate 
              <span style={{ color: "#f85149" }}>{cfg.deniedPct}%</span>
            </label>
            <input type="range" min={0} max={100} value={cfg.deniedPct}
              onChange={e => setCfg(c => ({ ...c, deniedPct: +e.target.value }))}
              style={{ width: "100%", accentColor: "#f85149", cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#484f58", marginTop: 6 }}>
              <span>0%</span><span>100%</span>
            </div>
          </div>

          {/* Payer */}
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#6e7681", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Force Payer (Optional)
            </label>
            <select className="field-select" value={cfg.payer} onChange={e => setCfg(c => ({ ...c, payer: e.target.value }))}>
              <option value="">Mixed Distribution (All Payers)</option>
              {PAYERS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          {/* Min Amt */}
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#6e7681", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Min Billed Amount ($)
            </label>
            <input type="number" className="field-input" value={cfg.minAmt} onChange={e => setCfg(c => ({ ...c, minAmt: +e.target.value }))} />
          </div>

          {/* Max Amt */}
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#6e7681", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Max Billed Amount ($)
            </label>
            <input type="number" className="field-input" value={cfg.maxAmt} onChange={e => setCfg(c => ({ ...c, maxAmt: +e.target.value }))} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ padding: "8px 16px" }}>
            {loading ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
            Generate {cfg.count} Claims
          </button>

          {results.length > 0 && (
            <>
              <button className="btn btn-secondary" onClick={exportJSON}>
                <Download size={14} /> Export JSON (EDI nested)
              </button>
              <button className="btn btn-secondary" onClick={exportCSV}>
                <Download size={14} /> Export CSV (Flat)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results Stats */}
      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Generated",    value: results.length,      color: "#58a6ff" },
            { label: "Denied",       value: deniedCount,         color: "#f85149" },
            { label: "Paid",         value: paidCount,           color: "#3fb950" },
            { label: "Total Denied", value: fmt$(totalDeniedAmt), color: "#ffa657" },
          ].map((s, i) => (
            <div key={s.label} className="card kpi-card" style={{ textAlign: "center" }}>
              <p className="kpi-label" style={{ marginBottom: 4 }}>{s.label}</p>
              <p className="kpi-value" style={{ color: s.color, marginBottom: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="section-title" style={{ margin: 0 }}>Output Preview</p>
            <p style={{ fontSize: 12, color: "#8b949e" }}>Showing first {Math.min(results.length, 50)} records</p>
          </div>
          <div style={{ overflowX: "auto", maxHeight: 500, overflowY: "auto" }}>
            <table className="data-table">
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  <th>Claim ID</th>
                  <th>Payer</th>
                  <th>Status</th>
                  <th>CPT</th>
                  <th>ICD-10</th>
                  <th>Billed</th>
                  <th>Paid</th>
                  <th>CARC</th>
                  <th>Category</th>
                  <th>Recovery</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 50).map((r, i) => {
                  const isDenied = r.edi835.pc_ClaimStatus === "4";
                  return (
                    <tr key={i}>
                      <td><span className="mono" style={{ color: "#58a6ff", fontWeight: 600, fontSize: 12 }}>{r.edi835.pc_ClaimID}</span></td>
                      <td style={{ color: "#8b949e" }}>{r.edi835.cp_PayerName.split(" ").slice(0, 2).join(" ")}</td>
                      <td>
                        <span className={`badge ${isDenied ? "badge-denied" : "badge-paid"}`}>
                          {isDenied ? "Denied" : "Paid"}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>{r.edi835.pcl_ProcedureCode}</td>
                      <td className="mono" style={{ fontSize: 12, color: "#8b949e" }}>{r.edi837.ec_PrincipalDiagnosis}</td>
                      <td>{fmt$(r.edi835.pc_ClaimAmount)}</td>
                      <td style={{ color: "#3fb950" }}>{fmt$(r.edi835.pc_ClaimPaid)}</td>
                      <td>
                        {isDenied
                          ? <span className="badge badge-carc mono">{r.edi835.pcla_AdjustmentReason}</span>
                          : <span style={{ color: "#484f58", fontSize: 12 }}>—</span>
                        }
                      </td>
                      <td style={{ color: "#8b949e", fontSize: 12 }}>{r._meta.carc_category}</td>
                      <td style={{ color: r._meta.recovery_pct > 0 ? "#3fb950" : "#484f58", fontWeight: 600, fontSize: 12 }}>
                        {r._meta.recovery_pct > 0 ? `${r._meta.recovery_pct}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !loading && (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center", borderStyle: "dashed", borderColor: "#30363d" }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>⚡</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#e6edf3", marginBottom: 8 }}>Ready to Generate Claims</p>
          <p style={{ fontSize: 13, color: "#8b949e", maxWidth: 400, margin: "0 auto" }}>
            Adjust the sliders above and click Generate. The engine will simulate proper EDI 835/837 matching and appropriate CARC distributions.
          </p>
        </div>
      )}
    </div>
  );
}
