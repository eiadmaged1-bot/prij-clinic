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
  return request<{ results: Array<MedicationSafetyProfileResult["profile"] & { id: string; medicationGeneric?: { genericName?: string; familyName?: string | null; className?: string | null } }> }>(`/reference/medication-safety-profiles/search?q=${encodeURIComponent(query)}`);
}
