"use client";
import { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { ALL_CLAIMS, CLAIM_ANALYSES } from "@/lib/mockData";
import { CARC_REFERENCE } from "@/lib/ediTypes";
import Link from "next/link";

const PAGE_SIZE = 15;

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const PAYERS = [...new Set(ALL_CLAIMS.map(c => c.edi835.cp_PayerName))].sort();
const CARCS  = [...new Set(ALL_CLAIMS.filter(c => c.edi835.pc_ClaimStatus === "4").map(c => c.edi835.pcla_AdjustmentReason))].sort();

export default function ClaimsPage() {
  const [search, setSearch]         = useState("");
  const [filterPayer, setFilterPayer]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCARC, setFilterCARC]     = useState("");
  const [showFilters, setShowFilters]   = useState(false);
  const [page, setPage]             = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let d = [...ALL_CLAIMS];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(c =>
        c.edi835.pc_ClaimID.toLowerCase().includes(q) ||
        c.edi835.cp_PayerName.toLowerCase().includes(q) ||
        c.edi835.pcl_ProcedureCode.includes(q) ||
        c.edi837.ec_PrincipalDiagnosis.toLowerCase().includes(q) ||
        `${c.edi835.pc_PatientFirst} ${c.edi835.pc_PatientLast}`.toLowerCase().includes(q)
      );
    }
    if (filterPayer)  d = d.filter(c => c.edi835.cp_PayerName === filterPayer);
    if (filterStatus === "denied") d = d.filter(c => c.edi835.pc_ClaimStatus === "4");
    if (filterStatus === "paid")   d = d.filter(c => c.edi835.pc_ClaimStatus !== "4");
    if (filterCARC)   d = d.filter(c => c.edi835.pcla_AdjustmentReason === filterCARC);
    return d;
  }, [search, filterPayer, filterStatus, filterCARC]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeFilters = [filterPayer, filterStatus, filterCARC].filter(Boolean).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Claim Explorer</h1>
        <p className="page-desc">Search and filter EDI 835/837 claim records</p>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#484f58", pointerEvents: "none" }} />
          <input
            className="field-input"
            style={{ paddingLeft: 34 }}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search claim ID, patient, payer, CPT, ICD-10..."
          />
        </div>
        <button
          className={`btn ${activeFilters ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={13} />
          Filters {activeFilters > 0 && `(${activeFilters})`}
        </button>
        {activeFilters > 0 && (
          <button className="btn btn-secondary"
            onClick={() => { setFilterPayer(""); setFilterStatus(""); setFilterCARC(""); setPage(1); }}>
            Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card" style={{ padding: 16, marginBottom: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { label: "Payer",     val: filterPayer,  set: setFilterPayer,  opts: PAYERS.map(p => ({ v: p, l: p })) },
            { label: "Status",    val: filterStatus, set: setFilterStatus, opts: [{ v: "denied", l: "Denied" }, { v: "paid", l: "Paid" }] },
            { label: "CARC Code", val: filterCARC,   set: setFilterCARC,   opts: CARCS.map(c => ({ v: c, l: `${c} — ${CARC_REFERENCE[c]?.category ?? "Other"}` })) },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: "block", fontSize: 11, color: "#6e7681", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{f.label}</label>
              <select className="field-select" value={f.val} onChange={e => { f.set(e.target.value); setPage(1); }}>
                <option value="">All</option>
                {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Row count */}
      <div style={{ fontSize: 12, color: "#6e7681", marginBottom: 10 }}>
        <span style={{ color: "#e6edf3", fontWeight: 600 }}>{filtered.length}</span> claims &nbsp;·&nbsp; Page {page} of {totalPages || 1}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Patient</th>
                <th>Payer</th>
                <th>CPT</th>
                <th>ICD-10</th>
                <th>Billed</th>
                <th>Denied $</th>
                <th>CARC</th>
                <th>Recovery</th>
                <th>Status</th>
                <th style={{ width: 72 }}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(c => {
                const analysis   = CLAIM_ANALYSES.get(c.edi835.pc_ClaimID);
                const isExpanded = expandedId === c.edi835.pc_ClaimID;
                const isDenied   = c.edi835.pc_ClaimStatus === "4";
                const color = analysis?.recoverabilityVerdict === "recoverable"     ? "#3fb950"
                            : analysis?.recoverabilityVerdict === "not_recoverable" ? "#f85149"
                            : "#ffa657";

                return (
                  <>
                    <tr key={c.edi835.pc_ClaimID}
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : c.edi835.pc_ClaimID)}>
                      <td>
                        <span className="mono" style={{ color: "#58a6ff", fontWeight: 600, fontSize: 12 }}>
                          {c.edi835.pc_ClaimID}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{c.edi835.pc_PatientFirst} {c.edi835.pc_PatientLast}</td>
                      <td style={{ color: "#8b949e", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.edi835.cp_PayerName}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>{c.edi835.pcl_ProcedureCode}</td>
                      <td className="mono" style={{ fontSize: 12, color: "#8b949e" }}>{c.edi837.ec_PrincipalDiagnosis}</td>
                      <td>{fmt$(c.edi835.pc_ClaimAmount)}</td>
                      <td style={{ color: "#f85149", fontWeight: 600 }}>{fmt$(c.edi835.pcla_AdjustmentAmount)}</td>
                      <td>
                        {isDenied
                          ? <span className="badge badge-carc mono">{c.edi835.pcla_AdjustmentReason}</span>
                          : <span style={{ color: "#484f58", fontSize: 12 }}>—</span>
                        }
                      </td>
                      <td style={{ fontWeight: 600, color, fontSize: 12 }}>
                        {analysis ? `${analysis.recoverabilityScore}%` : "—"}
                      </td>
                      <td>
                        <span className={`badge ${isDenied ? "badge-denied" : "badge-paid"}`}>
                          {isDenied ? "Denied" : "Paid"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Link href={`/claims/${c.edi835.pc_ClaimID}`} onClick={e => e.stopPropagation()}
                            style={{ display: "flex", padding: 5, color: "#484f58", borderRadius: 5, textDecoration: "none" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#58a6ff")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#484f58")}>
                            <ExternalLink size={13} />
                          </Link>
                          <button style={{ display: "flex", padding: 5, background: "none", border: "none", cursor: "pointer", color: "#484f58", borderRadius: 5 }}>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && analysis && (
                      <tr key={`${c.edi835.pc_ClaimID}-exp`}>
                        <td colSpan={11} style={{ background: "#0d1117", padding: "12px 16px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                            {[
                              { title: "Root Cause",         text: analysis.rootCause,         color: "#f85149" },
                              { title: "AI Recommendation",  text: analysis.aiRecommendation,  color: "#58a6ff" },
                              { title: "Evidence Summary",   text: analysis.supportingEvidence.slice(0, 3).join(" · "), color: "#ffa657" },
                            ].map(b => (
                              <div key={b.title} style={{ padding: "10px 14px", background: "#161b22", border: "1px solid #21262d", borderRadius: 8 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: b.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{b.title}</p>
                                <p style={{ fontSize: 12, color: "#c9d1d9", lineHeight: 1.55 }}>{b.text}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#484f58" }}>
                    No claims match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #21262d" }}>
          <span style={{ fontSize: 12, color: "#6e7681" }}>{filtered.length} total records</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "5px 8px", background: "none", border: "1px solid #30363d", borderRadius: 6, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.35 : 1, color: "#8b949e", display: "flex" }}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
              const pg = Math.max(1, Math.min(page - 2, (totalPages || 1) - 4)) + i;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", background: pg === page ? "#1f6feb" : "transparent", borderColor: pg === page ? "#1f6feb" : "#30363d", color: pg === page ? "#fff" : "#8b949e" }}>
                  {pg}
                </button>
              );
            })}
            <button disabled={page === (totalPages || 1)} onClick={() => setPage(p => p + 1)}
              style={{ padding: "5px 8px", background: "none", border: "1px solid #30363d", borderRadius: 6, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.35 : 1, color: "#8b949e", display: "flex" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
