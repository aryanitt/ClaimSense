"use client";
import { use } from "react";
import { ALL_CLAIMS, CLAIM_ANALYSES } from "@/lib/mockData";
import { CARC_REFERENCE, RARC_REFERENCE } from "@/lib/ediTypes";
import { findSimilarClaims } from "@/lib/claimAnalysis";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function FieldRow({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <span className={`field-value${mono ? " mono" : ""}`} style={{ color: color || "#e6edf3" }}>{value || "—"}</span>
    </div>
  );
}

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const claim     = ALL_CLAIMS.find(c => c.edi835.pc_ClaimID === id);
  const analysis  = claim ? CLAIM_ANALYSES.get(id) : undefined;

  if (!claim || !analysis) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
        <p style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 8 }}>Claim not found: {id}</p>
        <Link href="/claims" style={{ color: "#58a6ff", fontSize: 13, textDecoration: "none" }}>← Back to Claims</Link>
      </div>
    );
  }

  const { edi835, edi837 } = claim;
  const carcInfo   = CARC_REFERENCE[edi835.pcla_AdjustmentReason];
  const rarcDesc   = RARC_REFERENCE[edi835.pcl_RemarkCodes] || "";
  const similar    = findSimilarClaims(claim, ALL_CLAIMS).slice(0, 4);
  const isDenied   = edi835.pc_ClaimStatus === "4";
  const verdictColor = analysis.recoverabilityVerdict === "recoverable"     ? "#3fb950"
                     : analysis.recoverabilityVerdict === "not_recoverable" ? "#f85149"
                     : "#ffa657";

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className="page-header">
        <Link href="/claims" style={{ fontSize: 12, color: "#8b949e", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
          <ArrowLeft size={12} /> Back to Claims
        </Link>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 className="mono" style={{ fontSize: 20, fontWeight: 700, color: "#e6edf3" }}>{id}</h1>
              <span className={`badge ${isDenied ? "badge-denied" : "badge-paid"}`}>
                {isDenied ? "Denied" : "Paid"}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#8b949e" }}>
              {edi835.pc_PatientFirst} {edi835.pc_PatientLast} &nbsp;·&nbsp; {edi835.cp_PayerName} &nbsp;·&nbsp; DOS: {edi837.ec_ServiceDateFrom}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 30, fontWeight: 700, color: verdictColor, lineHeight: 1 }}>{analysis.recoverabilityScore}%</p>
            <p style={{ fontSize: 12, color: "#6e7681", marginTop: 4 }}>Recovery Probability</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: verdictColor, marginTop: 2, textTransform: "capitalize" }}>
              {analysis.recoverabilityVerdict.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* EDI 835 / 837 side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 260px", gap: 14, marginBottom: 14 }}>
        {/* 837 */}
        <div className="card" style={{ padding: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#58a6ff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            EDI 837 — Claim Submission
          </p>
          <FieldRow label="ec_ClaimNo"          value={edi837.ec_ClaimNo}          mono />
          <FieldRow label="ec_PayerName"         value={edi837.ec_PayerName}        />
          <FieldRow label="ec_InsuranceType"     value={edi837.ec_InsuranceType}    />
          <FieldRow label="ec_PrincipalDiagnosis" value={edi837.ec_PrincipalDiagnosis} mono />
          {edi837.ec_Diag2 && <FieldRow label="ec_Diag2" value={edi837.ec_Diag2} mono />}
          <FieldRow label="ec_ServiceDateFrom"   value={edi837.ec_ServiceDateFrom}  mono />
          <FieldRow label="ec_BillProvNPI"       value={edi837.ec_BillProvNPI}      mono />
          <FieldRow label="ec_PriorAuthorization"
            value={edi837.ec_PriorAuthorization || "Not Present"}
            color={edi837.ec_PriorAuthorization ? "#3fb950" : "#f85149"} />
          <FieldRow label="ec_ClaimFrequency"
            value={edi837.ec_ClaimFrequency === "1" ? "1 — Original" : edi837.ec_ClaimFrequency === "7" ? "7 — Replacement" : "8 — Void"} />
          {edi837.ec_DelayReasonCode && <FieldRow label="ec_DelayReasonCode" value={edi837.ec_DelayReasonCode} color="#ffa657" mono />}
          <FieldRow label="cd_ProcedureCode"    value={edi837.cd_ProcedureCode}   mono />
          <FieldRow label="cd_Amount"           value={fmt$(edi837.cd_Amount)}    />
        </div>

        {/* 835 */}
        <div className="card" style={{ padding: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#79c0ff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            EDI 835 — Remittance Advice
          </p>
          <FieldRow label="pc_ClaimID"       value={edi835.pc_ClaimID}      mono />
          <FieldRow label="cp_PayerName"     value={edi835.cp_PayerName}    />
          <FieldRow label="pc_ClaimStatus"
            value={isDenied ? "4 — Denied" : "1 — Processed"}
            color={isDenied ? "#f85149" : "#3fb950"} />
          <FieldRow label="pc_InsuranceType" value={edi835.pc_InsuranceType} />
          <FieldRow label="pc_ClaimAmount"   value={fmt$(edi835.pc_ClaimAmount)} />
          <FieldRow label="pc_ClaimPaid"     value={fmt$(edi835.pc_ClaimPaid)} color="#3fb950" />
          <FieldRow label="pc_ReceivedDate"  value={edi835.pc_ReceivedDate} mono />
          <FieldRow label="pcl_ProcedureCode" value={edi835.pcl_ProcedureCode} mono />
          {edi835.pcl_ProcedureModifier1 && <FieldRow label="pcl_Modifier1" value={edi835.pcl_ProcedureModifier1} mono />}
          <FieldRow label="pcla_AdjustmentGroup"  value={edi835.pcla_AdjustmentGroup} color="#ffa657" />
          <FieldRow label="pcla_AdjustmentReason" value={`CARC ${edi835.pcla_AdjustmentReason}`} color="#ffa657" mono />
          <FieldRow label="pcla_AdjustmentAmount" value={fmt$(edi835.pcla_AdjustmentAmount)} color="#f85149" />
          {edi835.pcl_RemarkCodes && <FieldRow label="pcl_RemarkCodes (RARC)" value={edi835.pcl_RemarkCodes} mono color="#d2a8ff" />}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Recovery score */}
          <div className="card" style={{ padding: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6e7681", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Assessment</p>
            <div style={{ textAlign: "center", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #21262d" }}>
              <p style={{ fontSize: 32, fontWeight: 700, color: verdictColor, lineHeight: 1 }}>{analysis.recoverabilityScore}%</p>
              <p style={{ fontSize: 11, color: "#6e7681", marginTop: 6 }}>AI Recovery Probability</p>
            </div>
            <div className="field-row"><span className="field-label">Typical CARC</span><span className="field-value">{carcInfo?.typicalRecovery ?? "—"}%</span></div>
            <div className="field-row"><span className="field-label">AI Confidence</span><span className="field-value" style={{ color: "#58a6ff" }}>{analysis.confidenceScore}%</span></div>
            {analysis.filingDaysUsed !== undefined && (
              <div className="field-row">
                <span className="field-label">Days Filed</span>
                <span className="field-value" style={{ color: analysis.filingDaysUsed > (analysis.filingLimitDays ?? 180) ? "#f85149" : "#3fb950" }}>
                  {analysis.filingDaysUsed} / {analysis.filingLimitDays}
                </span>
              </div>
            )}
          </div>

          {/* Prior Auth */}
          <div className="card" style={{ padding: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6e7681", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Prior Authorization</p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              {edi837.ec_PriorAuthorization
                ? <CheckCircle size={16} color="#3fb950" style={{ flexShrink: 0, marginTop: 1 }} />
                : <AlertCircle size={16} color="#ffa657" style={{ flexShrink: 0, marginTop: 1 }} />}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: edi837.ec_PriorAuthorization ? "#3fb950" : "#ffa657" }}>
                  {edi837.ec_PriorAuthorization ? "On File" : "Not Present"}
                </p>
                <p className="mono" style={{ fontSize: 11, color: "#e6edf3", marginTop: 3 }}>
                  {edi837.ec_PriorAuthorization || "No auth found in 837"}
                </p>
              </div>
            </div>
          </div>

          {/* Appeal deadline */}
          {analysis.appealDeadline && (
            <div className="card" style={{ padding: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6e7681", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Appeal Deadline</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#ffa657" }}>{analysis.appealDeadline}</p>
              <p style={{ fontSize: 11, color: "#6e7681", marginTop: 4 }}>90 days from payer receipt</p>
            </div>
          )}

          {/* Timeline */}
          <div className="card" style={{ padding: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6e7681", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Timeline</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { date: edi837.ec_ServiceDateFrom, label: "Service Date",     color: "#58a6ff" },
                { date: edi835.pc_ReceivedDate,    label: "Payer Received",   color: "#79c0ff" },
                { date: analysis.appealDeadline!,  label: "Appeal Deadline",  color: "#ffa657" },
              ].filter(t => t.date).map((t, i, arr) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0, marginTop: 3 }} />
                    {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: "#21262d", margin: "4px 0", minHeight: 20 }} />}
                  </div>
                  <div style={{ paddingBottom: i < arr.length - 1 ? 14 : 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3" }}>{t.label}</p>
                    <p className="mono" style={{ fontSize: 11, color: "#6e7681" }}>{t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CARC / RARC */}
      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3", marginBottom: 14 }}>CARC / RARC Interpretation</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 14, background: "#0d1117", border: "1px solid #21262d", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span className="badge badge-carc mono">CARC {edi835.pcla_AdjustmentReason}</span>
              <span style={{ fontSize: 11, color: "#6e7681" }}>{carcInfo?.category}</span>
              {carcInfo && <span style={{ fontSize: 11, color: "#3fb950", marginLeft: "auto" }}>~{carcInfo.typicalRecovery}% typical recovery</span>}
            </div>
            <p style={{ fontSize: 13, color: "#c9d1d9", lineHeight: 1.65 }}>{carcInfo?.description || "See payer EOB for detail"}</p>
          </div>
          <div style={{ padding: 14, background: "#0d1117", border: "1px solid #21262d", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span className="badge mono" style={{ background: "rgba(210,168,255,0.1)", color: "#d2a8ff", borderColor: "rgba(210,168,255,0.3)" }}>
                {edi835.pcl_RemarkCodes ? `RARC ${edi835.pcl_RemarkCodes}` : "No RARC"}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#c9d1d9", lineHeight: 1.65 }}>{rarcDesc || "No additional remark code information"}</p>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>AI Root Cause Analysis</p>
          <span className="badge badge-blue">{analysis.confidenceScore}% confidence</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 16, background: "#1a0d0d", border: "1px solid #4a1a1a", borderRadius: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#f85149", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Root Cause</p>
            <p style={{ fontSize: 13, color: "#e6edf3", lineHeight: 1.65 }}>{analysis.rootCause}</p>
          </div>
          <div style={{ padding: 16, background: "#0d1a2e", border: "1px solid #1a3a5a", borderRadius: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#58a6ff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>AI Recommendation</p>
            <p style={{ fontSize: 13, color: "#e6edf3", lineHeight: 1.65 }}>{analysis.aiRecommendation}</p>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#6e7681", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Supporting Evidence</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {analysis.supportingEvidence.map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#8b949e" }}>
                <span style={{ color: "#58a6ff", flexShrink: 0 }}>›</span> {ev}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similar Claims */}
      {similar.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #21262d" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>Similar Historical Claims</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Payer</th>
                <th>CPT</th>
                <th>ICD-10</th>
                <th>Status</th>
                <th>Similarity</th>
              </tr>
            </thead>
            <tbody>
              {similar.map(({ claim: sc, score }) => (
                <tr key={sc.edi835.pc_ClaimID}>
                  <td>
                    <Link href={`/claims/${sc.edi835.pc_ClaimID}`} className="mono"
                      style={{ color: "#58a6ff", fontWeight: 600, fontSize: 12, textDecoration: "none" }}>
                      {sc.edi835.pc_ClaimID}
                    </Link>
                  </td>
                  <td style={{ color: "#8b949e" }}>{sc.edi835.cp_PayerName.split(" ")[0]}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{sc.edi835.pcl_ProcedureCode}</td>
                  <td className="mono" style={{ fontSize: 12, color: "#8b949e" }}>{sc.edi837.ec_PrincipalDiagnosis}</td>
                  <td>
                    <span className={`badge ${sc.edi835.pc_ClaimStatus !== "4" ? "badge-paid" : "badge-denied"}`}>
                      {sc.edi835.pc_ClaimStatus !== "4" ? "Paid" : "Denied"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "#58a6ff", fontSize: 12 }}>{score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
