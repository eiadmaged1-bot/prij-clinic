import { getApiBaseUrl } from "./api-base-url";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { credentials: "include", ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error("Could not load Care Assist data.");
  return (await response.json()) as T;
}

export type CareAssistFinding = {
  id: string;
  title: string;
  message: string;
  category: string;
  severity: string;
  status: string;
  missingFieldsJson?: unknown;
  suggestedActionJson?: unknown;
  sourceJson?: unknown;
  snoozedUntil?: string | null;
  createdAt?: string;
};

export function evaluateCareAssist(input: { patientId: string; encounterId?: string; historySheetId?: string; prescriptionId?: string; investigationOrderId?: string }) {
  return request<{ findings: CareAssistFinding[] }>("/care-assist/evaluate", { method: "POST", body: JSON.stringify(input) });
}

export function listCareAssistFindings(patientId: string) {
  return request<{ findings: CareAssistFinding[] }>(`/care-assist/findings?patientId=${encodeURIComponent(patientId)}`);
}

export function decideCareAssistFinding(id: string, input: { decision: "ACCEPT" | "DISMISS" | "SNOOZE" | "RESOLVE"; reason?: string; snoozedUntil?: string }) {
  return request<CareAssistFinding>(`/care-assist/findings/${id}/decision`, { method: "POST", body: JSON.stringify(input) });
}

export type MedicationSafetyProfileResult = {
  medication?: {
    id: string;
    genericName: string;
    familyName?: string | null;
    className?: string | null;
    pharmacologicClass?: string | null;
  };
  profile?: {
    legacyPregnancyCategory: string;
    lactationRiskLevel: string;
    sourceName: string;
    sourceUrl?: string | null;
    sourceYear?: number | null;
    sourceType: string;
    reviewStatus: string;
    confidenceLevel: string;
    lastCheckedAt?: string | null;
    sourceLastUpdatedAt?: string | null;
    sourceVersionLabel?: string | null;
    sourceRefreshStatus?: string | null;
    sourceRefreshNote?: string | null;
    reviewedAt?: string | null;
    reviewedByUser?: { id: string; displayName?: string | null; email?: string | null } | null;
    pregnancyRiskSummary?: string | null;
    pregnancyClinicalConsiderations?: string | null;
    pregnancyDataSummary?: string | null;
    lactationRiskSummary?: string | null;
    lactationMilkTransferSummary?: string | null;
    lactationInfantEffectsSummary?: string | null;
    lactationClinicalConsiderations?: string | null;
    reproductivePotentialNotes?: string | null;
  } | null;
  warning?: string;
};

export function getMedicationSafetyProfile(medicationGenericId: string) {
  return request<MedicationSafetyProfileResult>(`/reference/medications/${medicationGenericId}/safety-profile`);
}

export function searchMedicationSafetyProfiles(query = "") {
  return request<{ results: Array<MedicationSafetyProfileResult["profile"] & { id: string; medicationGeneric?: { id?: string; genericName?: string; familyName?: string | null; className?: string | null } }> }>(`/reference/medication-safety-profiles/search?q=${encodeURIComponent(query)}`);
}

export function updateMedicationSafetyProfileReview(medicationGenericId: string, input: Record<string, unknown>) {
  return request<MedicationSafetyProfileResult["profile"] & { id: string }>(`/reference/medications/${encodeURIComponent(medicationGenericId)}/safety-profile`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export type MedicationSafetyImportPreview = {
  summary: { rows: number; accepted: number; rejected: number; warnings: number };
  accepted: Array<{
    rowNumber: number;
    genericName: string;
    medicationGenericId: string;
    legacyPregnancyCategory: string;
    lactationRiskLevel: string;
    sourceName: string;
    sourceYear: number | null;
    sourceType: string;
    confidenceLevel: string;
    reviewStatus: "needs_review";
    warnings: string[];
  }>;
  rejected: Array<{ rowNumber: number; genericName?: string; errors: string[]; warnings: string[] }>;
  warning: string;
};

export function previewMedicationSafetyImport(input: { fileName: string; content: string }) {
  return request<MedicationSafetyImportPreview>("/reference/medication-safety-profiles/import-preview", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function commitMedicationSafetyImport(input: { fileName: string; content: string }) {
  return request<{ jobId: string; createdOrUpdated: number; preview: MedicationSafetyImportPreview; reviewStatus: "needs_review" }>("/reference/medication-safety-profiles/import-commit", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function listMedicationSafetyImportJobs() {
  return request<{ jobs: Array<{ id: string; resourceId?: string | null; actorUserId?: string | null; action: string; metadataJson?: unknown; createdAt: string }> }>("/reference/medication-safety-profiles/import-jobs");
}

export function listMedicationSafetyReviewQueue() {
  return request<{ results: Array<MedicationSafetyProfileResult["profile"] & { id: string; medicationGeneric?: { id?: string; genericName?: string; familyName?: string | null; className?: string | null } }> }>("/reference/medication-safety-profiles/review-queue");
}

export function decideMedicationSafetyProfileReview(profileId: string, input: { decision: "approve" | "reject" | "retire"; reason: string }) {
  return request<MedicationSafetyProfileResult["profile"] & { id: string }>(`/reference/medication-safety-profiles/${encodeURIComponent(profileId)}/review-decision`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}
