import { getApiBaseUrl } from "./api-base-url";
import { expandSearchShortcut } from "./search-shortcuts";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return {
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) }
  });
  if (!response.ok) throw new Error("Could not load medication information.");
  return (await response.json()) as T;
}

export type MedicationResult = {
  type: string;
  id: string;
  genericName?: string | null;
  brandName?: string | null;
  tradeName?: string | null;
  family?: string | null;
  familyName?: string | null;
  className?: string | null;
  pharmacologicClass?: string | null;
  route?: string | null;
  dosageForm?: string | null;
  strengthText?: string | null;
  verificationStatus?: string | null;
  reviewStatus?: string | null;
  source?: string | null;
  lastReviewed?: string | null;
  countryCode?: string | null;
  pregnancyProfile?: string | null;
  lactationProfile?: string | null;
};

export function searchMedications(query: string) {
  return request<{ query: string; results: MedicationResult[] }>("/medications/search", {
    method: "POST",
    body: JSON.stringify({ query: expandSearchShortcut(query) })
  });
}

export function listDrugFamilies() {
  return request<Array<{ id: string; code: string; displayName: string; aliases?: string[]; verificationStatus: string }>>("/medications/families");
}

export type PharmacologySearchResult = { id: string; genericName: string; family?: string | null; pharmacologicClass?: string | null; reviewStatus: string; mainUse: string; keyCaution: string; clearance: string; matchReason: string; profileCompleteness: number };
export type PharmacologyProfile = PharmacologySearchResult & Record<string, unknown> & { className?: string | null; aliases?: Array<{ alias: string; scopeType: string }>; mechanism?: string[]; pharmacodynamics?: string[]; pharmacokinetics?: Array<Record<string, unknown>>; adverseEffects?: Array<Record<string, unknown>>; contraindications?: Array<Record<string, unknown>>; cautions?: Array<Record<string, unknown>>; interactions?: Array<Record<string, unknown>>; monitoring?: Array<Record<string, unknown>>; pregnancyLactation?: Array<Record<string, unknown>>; renal?: Array<Record<string, unknown>>; hepatic?: Array<Record<string, unknown>>; spectrum?: Array<Record<string, unknown>>; calculators?: Array<Record<string, unknown>>; sources?: Array<Record<string, unknown>>; doctorReviewRequired: boolean };

export function searchPharmacology(query: string) {
  return request<{ query: string; results: PharmacologySearchResult[]; genericFirst: boolean; tradeNamesAreAliasesOnly: boolean }>(`/pharmacology/search?q=${encodeURIComponent(query)}`);
}

export function getPharmacologyProfile(id: string) {
  return request<PharmacologyProfile>(`/pharmacology/generics/${encodeURIComponent(id)}`);
}

export function getMedicationIngredient(id: string) {
  return request(`/medications/ingredients/${id}`);
}

export function getMedicationProduct(id: string) {
  return request(`/medications/products/${id}`);
}

export function runMedicationSafetyCheck(input: { patientId?: string; prescriptionId?: string; medications?: Array<Record<string, string>> }) {
  return request("/medications/safety-check", { method: "POST", body: JSON.stringify(input) });
}

export function listSafetyChecks(patientId?: string) {
  return request(`/medications/safety-checks${patientId ? `?patientId=${patientId}` : ""}`);
}

export function reviewSafetyAlert(id: string, status = "reviewed") {
  return request(`/medications/safety-alerts/${id}/review`, { method: "POST", body: JSON.stringify({ status }) });
}

export function overrideSafetyAlert(id: string, reason: string) {
  return request(`/medications/safety-alerts/${id}/override`, { method: "POST", body: JSON.stringify({ reason }) });
}
