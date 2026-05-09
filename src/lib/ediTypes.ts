// EDI 835 — Remittance Advice (Payer Response)
export interface EDI835Claim {
  // Payment level (cp_ prefix)
  cp_PayerName: string;
  cp_PayerID: string;
  cp_PayeeName: string;
  cp_PaymentAmount: number;
  cp_EffectiveDate: string;

  // Claim level (pc_ prefix)
  pc_ClaimID: string;
  pc_ClaimStatus: "1" | "2" | "3" | "4" | "19" | "22"; // 4 = Denied
  pc_ClaimAmount: number;
  pc_ClaimPaid: number;
  pc_PatientResponsibility: number;
  pc_InsuranceType: "Medicare" | "Medicaid" | "Commercial" | "Managed Care";
  pc_StatementBegin: string;
  pc_StatementEnd: string;
  pc_ReceivedDate: string;
  pc_PriorAuthNum: string;
  pc_PatientLast: string;
  pc_PatientFirst: string;
  pc_RenderingID: string;

  // Line level (pcl_ prefix)
  pcl_ProcedureCode: string;
  pcl_ProcedureModifier1?: string;
  pcl_ProcedureModifier2?: string;
  pcl_ChargedAmount: number;
  pcl_PaidAmount: number;
  pcl_AllowedAmount: number;
  pcl_ServiceDate: string;
  pcl_RemarkCodes: string; // RARC codes

  // Adjustment level (pcla_ prefix)
  pcla_AdjustmentGroup: "CO" | "PR" | "OA" | "PI" | "CR";
  pcla_AdjustmentReason: string; // CARC code
  pcla_AdjustmentAmount: number;
  pcla_AdjustmentQty?: number;
}

// EDI 837 — Claim Submission (What was billed)
export interface EDI837Claim {
  // Claim level (ec_ prefix)
  ec_ClaimNo: string; // joins to pc_ClaimID
  ec_Amount: number;
  ec_PlaceOfService: string;
  ec_PayerName: string;
  ec_PayerID: string;
  ec_InsuranceType: "Medicare" | "Medicaid" | "Commercial" | "Managed Care";
  ec_PrincipalDiagnosis: string; // ICD-10
  ec_Diag2?: string;
  ec_Diag3?: string;
  ec_BillProvNPI: string;
  ec_RendProvNPI?: string;
  ec_RendProvSpecialty?: string;
  ec_ServiceDateFrom: string;
  ec_ServiceDateTo?: string;
  ec_PriorAuthorization: string;
  ec_TypeOfBill?: string;
  ec_ClaimFrequency: "1" | "7" | "8"; // 1=Original, 7=Replacement, 8=Void
  ec_DelayReasonCode?: string;
  ec_PatientRelationship?: string;
  ec_SubscriberID?: string;

  // Service line (cd_ prefix)
  cd_ProcedureCode: string;
  cd_Modifier1?: string;
  cd_Modifier2?: string;
  cd_Amount: number;
  cd_Quantity: number;
  cd_DiagPointer1?: string;
  cd_PlaceOfService?: string;
  cd_ServiceDateFrom?: string;
  cd_RevenueCode?: string;
  cd_PriorAuthNo?: string;
}

// Merged claim for analysis
export interface MergedClaim {
  edi835: EDI835Claim;
  edi837: EDI837Claim;
  analysis: ClaimAnalysis;
}

export interface ClaimAnalysis {
  claimId: string;
  rootCause: string;
  carcInterpretation: string;
  rarcInterpretation: string;
  recoverabilityVerdict: "recoverable" | "not_recoverable" | "needs_review";
  confidenceScore: number; // 0-100
  recoverabilityScore: number; // 0-100
  supportingEvidence: string[];
  aiRecommendation: string;
  appealDeadline?: string;
  filingDaysUsed?: number;
  filingLimitDays?: number;
  priorAuthIssue?: boolean;
  isDuplicate?: boolean;
  similarClaimsCount: number;
  historicalRecoveryRate: number;
}

// CARC Code reference
export const CARC_REFERENCE: Record<string, { description: string; category: string; typicalRecovery: number }> = {
  "4":   { description: "Procedure code inconsistent with modifier used or required modifier missing", category: "Coding", typicalRecovery: 72 },
  "16":  { description: "Claim/service lacks information needed for adjudication", category: "Information", typicalRecovery: 78 },
  "18":  { description: "Exact duplicate claim/service", category: "Duplicate", typicalRecovery: 45 },
  "22":  { description: "This care may be covered by another payer per COB", category: "COB", typicalRecovery: 60 },
  "29":  { description: "The time limit for filing has expired", category: "Timely Filing", typicalRecovery: 35 },
  "45":  { description: "Charge exceeds fee schedule/maximum allowable", category: "Fee Schedule", typicalRecovery: 15 },
  "50":  { description: "Non-covered services — not deemed medically necessary", category: "Medical Necessity", typicalRecovery: 55 },
  "55":  { description: "Procedure/treatment is experimental/investigational", category: "Non-Covered", typicalRecovery: 20 },
  "57":  { description: "Prior authorization absent", category: "Prior Auth", typicalRecovery: 65 },
  "96":  { description: "Non-covered charge(s)", category: "Non-Covered", typicalRecovery: 22 },
  "97":  { description: "Benefit included in payment for another adjudicated service", category: "Bundling", typicalRecovery: 40 },
  "109": { description: "Claim not covered by this payer/contractor", category: "Non-Covered", typicalRecovery: 18 },
  "119": { description: "Benefit maximum for this period reached", category: "Benefit Limit", typicalRecovery: 12 },
  "167": { description: "Diagnosis not covered, missing, or invalid", category: "Coding", typicalRecovery: 68 },
  "170": { description: "Payment denied for this type of provider", category: "Provider", typicalRecovery: 50 },
  "197": { description: "Precertification/authorization/notification absent", category: "Prior Auth", typicalRecovery: 65 },
  "252": { description: "Attachment/documentation required to adjudicate", category: "Documentation", typicalRecovery: 70 },
};

// RARC Code reference
export const RARC_REFERENCE: Record<string, string> = {
  "N20":  "Additional information is needed to process this claim",
  "N95":  "Not a covered benefit for this payer",
  "N386": "This decision was based on a local coverage determination",
  "N4":   "Missing/incomplete/invalid prior authorization number",
  "M15":  "Separately billed services have been bundled",
  "M51":  "Missing/incomplete/invalid procedure code(s)",
  "M76":  "Missing/incomplete/invalid diagnosis or condition",
  "MA01": "You may appeal this decision",
  "MA04": "Secondary payment cannot be considered without primary payer info",
};

// Payer filing limits (days from service date)
export const PAYER_FILING_LIMITS: Record<string, number> = {
  "Medicare": 365,
  "Medicaid": 365,
  "Blue Cross Blue Shield": 180,
  "BCBS": 180,
  "Aetna": 180,
  "United Healthcare": 90,
  "UnitedHealthcare": 90,
  "Cigna": 180,
  "Humana": 180,
  "Commercial": 180, // default commercial
};
