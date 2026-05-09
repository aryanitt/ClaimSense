import { EDI835Claim, EDI837Claim } from "./ediTypes";
import { analyzeClaimDenial, clusterDenials, DenialCluster } from "./claimAnalysis";

export type { EDI835Claim, EDI837Claim, DenialCluster };
export { clusterDenials };

export interface MergedClaim {
  edi835: EDI835Claim;
  edi837: EDI837Claim;
}

// ── The 4 exact sample claims from the assignment PDF ──────────────────────

const SAMPLE_CLAIMS: MergedClaim[] = [
  {
    edi835: {
      cp_PayerName: "Blue Cross Blue Shield", cp_PayerID: "BCBS-IL",
      cp_PayeeName: "General Hospital", cp_PaymentAmount: 0, cp_EffectiveDate: "2026-03-22",
      pc_ClaimID: "CLM-2026-00142", pc_ClaimStatus: "4",
      pc_ClaimAmount: 4500, pc_ClaimPaid: 0, pc_PatientResponsibility: 0,
      pc_InsuranceType: "Commercial", pc_StatementBegin: "2025-06-15", pc_StatementEnd: "2025-06-15",
      pc_ReceivedDate: "2026-03-20", pc_PriorAuthNum: "", pc_PatientLast: "Johnson", pc_PatientFirst: "Mary",
      pc_RenderingID: "1234567890",
      pcl_ProcedureCode: "99214", pcl_ChargedAmount: 4500, pcl_PaidAmount: 0, pcl_AllowedAmount: 0,
      pcl_ServiceDate: "2025-06-15", pcl_RemarkCodes: "",
      pcla_AdjustmentGroup: "CO", pcla_AdjustmentReason: "29", pcla_AdjustmentAmount: 4500,
    },
    edi837: {
      ec_ClaimNo: "CLM-2026-00142", ec_Amount: 4500, ec_PlaceOfService: "11 - Office",
      ec_PayerName: "Blue Cross Blue Shield", ec_PayerID: "BCBS-IL", ec_InsuranceType: "Commercial",
      ec_PrincipalDiagnosis: "J06.9", ec_BillProvNPI: "1234567890",
      ec_ServiceDateFrom: "2025-06-15", ec_ServiceDateTo: "2025-06-15",
      ec_PriorAuthorization: "", ec_ClaimFrequency: "1", ec_DelayReasonCode: "",
      ec_SubscriberID: "XYZ123456",
      cd_ProcedureCode: "99214", cd_Amount: 4500, cd_Quantity: 1, cd_DiagPointer1: "1",
    },
  },
  {
    edi835: {
      cp_PayerName: "Medicare Part B", cp_PayerID: "MEDICARE",
      cp_PayeeName: "Regional Medical Center", cp_PaymentAmount: 0, cp_EffectiveDate: "2026-02-12",
      pc_ClaimID: "CLM-2026-00287", pc_ClaimStatus: "4",
      pc_ClaimAmount: 12800, pc_ClaimPaid: 0, pc_PatientResponsibility: 0,
      pc_InsuranceType: "Medicare", pc_StatementBegin: "2026-01-08", pc_StatementEnd: "2026-01-08",
      pc_ReceivedDate: "2026-02-10", pc_PriorAuthNum: "", pc_PatientLast: "Williams", pc_PatientFirst: "Robert",
      pc_RenderingID: "9876543210",
      pcl_ProcedureCode: "27447", pcl_ProcedureModifier1: "",
      pcl_ChargedAmount: 12800, pcl_PaidAmount: 0, pcl_AllowedAmount: 0,
      pcl_ServiceDate: "2026-01-08", pcl_RemarkCodes: "N20",
      pcla_AdjustmentGroup: "CO", pcla_AdjustmentReason: "16", pcla_AdjustmentAmount: 12800,
    },
    edi837: {
      ec_ClaimNo: "CLM-2026-00287", ec_Amount: 12800, ec_PlaceOfService: "21 - Inpatient Hospital",
      ec_PayerName: "Medicare Part B", ec_PayerID: "MEDICARE", ec_InsuranceType: "Medicare",
      ec_PrincipalDiagnosis: "M17.11", ec_BillProvNPI: "9876543210",
      ec_ServiceDateFrom: "2026-01-08", ec_PriorAuthorization: "AUTH-998877",
      ec_TypeOfBill: "131", ec_ClaimFrequency: "1",
      cd_ProcedureCode: "27447", cd_Amount: 12800, cd_Quantity: 1,
    },
  },
  {
    edi835: {
      cp_PayerName: "Aetna", cp_PayerID: "AETNA-01",
      cp_PayeeName: "Radiology Associates", cp_PaymentAmount: 0, cp_EffectiveDate: "2026-03-01",
      pc_ClaimID: "CLM-2026-00391", pc_ClaimStatus: "4",
      pc_ClaimAmount: 8200, pc_ClaimPaid: 0, pc_PatientResponsibility: 0,
      pc_InsuranceType: "Commercial", pc_StatementBegin: "2026-02-20", pc_StatementEnd: "2026-02-20",
      pc_ReceivedDate: "2026-02-28", pc_PriorAuthNum: "", pc_PatientLast: "Garcia", pc_PatientFirst: "Carlos",
      pc_RenderingID: "5678901234",
      pcl_ProcedureCode: "72148", pcl_ChargedAmount: 8200, pcl_PaidAmount: 0, pcl_AllowedAmount: 0,
      pcl_ServiceDate: "2026-02-20", pcl_RemarkCodes: "N386",
      pcla_AdjustmentGroup: "CO", pcla_AdjustmentReason: "50", pcla_AdjustmentAmount: 8200,
    },
    edi837: {
      ec_ClaimNo: "CLM-2026-00391", ec_Amount: 8200, ec_PlaceOfService: "22 - Outpatient Hospital",
      ec_PayerName: "Aetna", ec_PayerID: "AETNA-01", ec_InsuranceType: "Commercial",
      ec_PrincipalDiagnosis: "M54.5", ec_Diag2: "M51.16",
      ec_BillProvNPI: "5678901234", ec_RendProvSpecialty: "Radiology",
      ec_ServiceDateFrom: "2026-02-20", ec_PriorAuthorization: "", ec_ClaimFrequency: "1",
      cd_ProcedureCode: "72148", cd_Amount: 8200, cd_Quantity: 1, cd_DiagPointer1: "1",
    },
  },
  {
    edi835: {
      cp_PayerName: "United Healthcare", cp_PayerID: "UHC-01",
      cp_PayeeName: "Primary Care Associates", cp_PaymentAmount: 0, cp_EffectiveDate: "2026-02-01",
      pc_ClaimID: "CLM-2026-00455", pc_ClaimStatus: "4",
      pc_ClaimAmount: 3200, pc_ClaimPaid: 0, pc_PatientResponsibility: 0,
      pc_InsuranceType: "Commercial", pc_StatementBegin: "2026-01-10", pc_StatementEnd: "2026-01-10",
      pc_ReceivedDate: "2026-01-28", pc_PriorAuthNum: "", pc_PatientLast: "Smith", pc_PatientFirst: "James",
      pc_RenderingID: "1234567890",
      pcl_ProcedureCode: "99213", pcl_ChargedAmount: 3200, pcl_PaidAmount: 0, pcl_AllowedAmount: 0,
      pcl_ServiceDate: "2026-01-10", pcl_RemarkCodes: "",
      pcla_AdjustmentGroup: "CO", pcla_AdjustmentReason: "18", pcla_AdjustmentAmount: 3200,
    },
    edi837: {
      ec_ClaimNo: "CLM-2026-00455", ec_Amount: 3200, ec_PlaceOfService: "11 - Office",
      ec_PayerName: "United Healthcare", ec_PayerID: "UHC-01", ec_InsuranceType: "Commercial",
      ec_PrincipalDiagnosis: "J20.9",
      ec_BillProvNPI: "1234567890", ec_ServiceDateFrom: "2026-01-10",
      ec_ClaimFrequency: "1",
      cd_ProcedureCode: "99213", cd_Amount: 3200, cd_Quantity: 1,
    },
  },
];

// ── Seeded synthetic claims (30 additional) ────────────────────────────────

let _seed = 42;
function sr(): number {
  _seed = (_seed * 1664525 + 1013904223) & 0xffffffff;
  return (_seed >>> 0) / 0xffffffff;
}
function ri(a: number, b: number) { return Math.floor(sr() * (b - a + 1)) + a; }
function rp<T>(arr: T[]): T { return arr[Math.floor(sr() * arr.length)]; }

const PAYERS = [
  { name: "Blue Cross Blue Shield", id: "BCBS-IL", limit: 180 },
  { name: "Aetna", id: "AETNA-01", limit: 180 },
  { name: "United Healthcare", id: "UHC-01", limit: 90 },
  { name: "Cigna", id: "CIGNA-01", limit: 180 },
  { name: "Humana", id: "HUMANA-01", limit: 180 },
  { name: "Medicare Part B", id: "MEDICARE", limit: 365 },
];

const CPT_CODES = ["99213","99214","99215","99232","93000","71046","80053","85025","27447","43239","45378","70553","73721","74177","64483","20610"];
const ICD10 = ["M54.5","I10","E11.9","J18.9","K21.0","M17.11","G43.909","F32.1","N18.3","J06.9","R07.9","M51.16"];
const CARCS = ["16","18","29","50","57","96","97","197","4","252"];
const FACILITIES = ["General Hospital","Regional Medical Center","Outpatient Surgery Center","Primary Care Associates","Cardiology Clinic","Radiology Associates"];
const NPIS = ["1234567890","9876543210","5678901234","4321098765","8765432109"];
const FIRST = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","David","Sarah","Thomas","Lisa"];
const LAST = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez"];

function makeSyntheticClaim(idx: number): MergedClaim {
  const payer = rp(PAYERS);
  const cpt = rp(CPT_CODES);
  const icd = rp(ICD10);
  const carc = rp(CARCS);
  const isPaid = sr() > 0.55;
  const billed = ri(500, 15000);
  const paid = isPaid ? Math.floor(billed * 0.75) : 0;
  const serviceDate = `2025-${String(ri(1,12)).padStart(2,"0")}-${String(ri(1,28)).padStart(2,"0")}`;
  const daysToReceive = ri(5, 250);
  const svc = new Date(serviceDate);
  const recv = new Date(svc.getTime() + daysToReceive * 86400000);
  const recvStr = recv.toISOString().split("T")[0];
  const hasAuth = sr() > 0.5;
  const claimId = `CLM-2025-${String(idx + 1).padStart(5,"0")}`;

  return {
    edi835: {
      cp_PayerName: payer.name, cp_PayerID: payer.id,
      cp_PayeeName: rp(FACILITIES), cp_PaymentAmount: paid, cp_EffectiveDate: recvStr,
      pc_ClaimID: claimId, pc_ClaimStatus: isPaid ? "1" : "4",
      pc_ClaimAmount: billed, pc_ClaimPaid: paid, pc_PatientResponsibility: isPaid ? ri(0, 500) : 0,
      pc_InsuranceType: payer.id === "MEDICARE" ? "Medicare" : "Commercial",
      pc_StatementBegin: serviceDate, pc_StatementEnd: serviceDate,
      pc_ReceivedDate: recvStr,
      pc_PriorAuthNum: hasAuth ? `AUTH-${ri(100000,999999)}` : "",
      pc_PatientLast: rp(LAST), pc_PatientFirst: rp(FIRST),
      pc_RenderingID: rp(NPIS),
      pcl_ProcedureCode: cpt, pcl_ChargedAmount: billed, pcl_PaidAmount: paid,
      pcl_AllowedAmount: paid > 0 ? Math.floor(billed * 0.8) : 0,
      pcl_ServiceDate: serviceDate, pcl_RemarkCodes: isPaid ? "" : rp(["N20","N386","N4","M51",""]),
      pcla_AdjustmentGroup: "CO",
      pcla_AdjustmentReason: isPaid ? "45" : carc,
      pcla_AdjustmentAmount: billed - paid,
    },
    edi837: {
      ec_ClaimNo: claimId, ec_Amount: billed, ec_PlaceOfService: rp(["11 - Office","22 - Outpatient Hospital","21 - Inpatient Hospital"]),
      ec_PayerName: payer.name, ec_PayerID: payer.id,
      ec_InsuranceType: payer.id === "MEDICARE" ? "Medicare" : "Commercial",
      ec_PrincipalDiagnosis: icd, ec_BillProvNPI: rp(NPIS),
      ec_ServiceDateFrom: serviceDate, ec_ServiceDateTo: serviceDate,
      ec_PriorAuthorization: hasAuth ? `AUTH-${ri(100000,999999)}` : "",
      ec_ClaimFrequency: "1",
      ec_DelayReasonCode: daysToReceive > payer.limit ? rp(["1","","","2",""]) : "",
      ec_SubscriberID: `MBR${ri(1000000,9999999)}`,
      cd_ProcedureCode: cpt, cd_Amount: billed, cd_Quantity: 1,
    },
  };
}

// ── Final combined dataset ─────────────────────────────────────────────────

export const ALL_CLAIMS: MergedClaim[] = [
  ...SAMPLE_CLAIMS,
  ...Array.from({ length: 30 }, (_, i) => makeSyntheticClaim(i)),
];

// Pre-compute analyses (deterministic)
export const CLAIM_ANALYSES = new Map(
  ALL_CLAIMS.map(c => [c.edi835.pc_ClaimID, analyzeClaimDenial(c.edi835, c.edi837)])
);

export function getClaimById(id: string): MergedClaim | undefined {
  return ALL_CLAIMS.find(c => c.edi835.pc_ClaimID === id);
}

export function getDeniedClaims(): MergedClaim[] {
  return ALL_CLAIMS.filter(c => c.edi835.pc_ClaimStatus === "4");
}

export function getPaidClaims(): MergedClaim[] {
  return ALL_CLAIMS.filter(c => c.edi835.pc_ClaimStatus !== "4");
}

export function getDashboardStats() {
  const denied = getDeniedClaims();
  const totalDenied = denied.reduce((s, c) => s + c.edi835.pcla_AdjustmentAmount, 0);
  const analyses = denied.map(c => CLAIM_ANALYSES.get(c.edi835.pc_ClaimID)!).filter(Boolean);
  const recoverable = analyses.filter(a => a.recoverabilityVerdict === "recoverable");
  const recoverableAmount = recoverable.reduce((s, a) => {
    const claim = getClaimById(a.claimId);
    return s + (claim?.edi835.pcla_AdjustmentAmount ?? 0);
  }, 0);
  const avgConfidence = analyses.reduce((s, a) => s + a.confidenceScore, 0) / (analyses.length || 1);
  const denialRate = (denied.length / ALL_CLAIMS.length) * 100;
  return { totalDenied, recoverableAmount, denialRate, avgConfidence, deniedCount: denied.length, recoverableCount: recoverable.length };
}

export function getDenialsByPayer() {
  const map: Record<string, { denied: number; amount: number }> = {};
  getDeniedClaims().forEach(c => {
    const p = c.edi835.cp_PayerName;
    if (!map[p]) map[p] = { denied: 0, amount: 0 };
    map[p].denied++;
    map[p].amount += c.edi835.pcla_AdjustmentAmount;
  });
  return Object.entries(map).map(([payer, v]) => ({ payer, ...v })).sort((a, b) => b.amount - a.amount);
}

export function getDenialsByCARC() {
  const map: Record<string, number> = {};
  getDeniedClaims().forEach(c => {
    const code = c.edi835.pcla_AdjustmentReason;
    map[code] = (map[code] || 0) + 1;
  });
  return Object.entries(map).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count);
}

export function getMonthlyTrend() {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months.map((month, i) => ({
    month,
    denials: 8 + Math.round(Math.sin(i * 0.8) * 3),
    recovered: 4 + Math.round(Math.sin(i * 0.6 + 1) * 2),
  }));
}
