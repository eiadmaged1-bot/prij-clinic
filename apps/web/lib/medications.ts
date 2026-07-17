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

export type PharmacologySearchResult = { id: string; genericName: string; family?: string | null; pharmacologicClass?: string | null; reviewStatus: string; mainUse: string; keyCaution: string; clearance: string; matchReason: string; spectrumMatches?: Array<{ label: string; coverage: string }>; profileCompleteness: number; prescriptionEligible: boolean; prescriptionBlockReason?: string };
export type FormulaInputField = { name: string; label?: string; type: "number" | "select"; unit?: string; required?: boolean; min?: number; max?: number; options?: string[]; observedAtField?: string };
export type ApprovedDoseFormula = { stableId: string; name: string; calculatorType: string; versions: Array<{ version: number; expression: string; outputUnit: string; inputSchemaJson: { fields?: FormulaInputField[] }; validRangeJson: unknown; populationText: string; exclusionsJson: unknown; approvalStatus: "approved"; roundingMethod: string; limitationsText: string; source: { title: string; organization: string; versionLabel?: string | null; sourceUrl?: string | null } }> };
export type MedicationFormulaResult = { stableId: string; name: string; version: number; expression: string; formula: string; input: Record<string, unknown>; outputUnit: string; preRoundingValue: number; roundingMethod: string; finalValue: number; population: string; exclusions: unknown; limitations: string; warnings: string[]; source: { title: string; organization: string; versionLabel?: string | null; sourceUrl?: string | null }; reviewer: { displayName: string }; approvalStatus: string; doctorConfirmationRequired: true; prescriptionInsertionPerformed: false };
export type OfficialMedicationProfile = { publicationState: "SOURCE_VERIFIED" | "SOURCE_CONFLICT" | "SOURCE_INCOMPLETE"; sectionCoverage: Record<string, string>; indications: string[]; mechanism: string[]; contraindications: string[]; warnings: string[]; adverseEffects: string[]; interactions: string[]; pregnancy: string[]; lactation: string[]; renal: string[]; hepatic: string[]; monitoring: string[]; routes: string[]; dosageForms: string[]; boxedWarning: boolean; conflicts?: unknown; source: Record<string, unknown> };
export type PharmacologyProfile = PharmacologySearchResult & Record<string, unknown> & { className?: string | null; aliases?: Array<{ alias: string; scopeType: string }>; mechanism?: string[]; pharmacodynamics?: string[]; pharmacokinetics?: Array<Record<string, unknown>>; adverseEffects?: Array<Record<string, unknown>>; contraindications?: Array<Record<string, unknown>>; cautions?: Array<Record<string, unknown>>; interactions?: Array<Record<string, unknown>>; monitoring?: Array<Record<string, unknown>>; pregnancyLactation?: Array<Record<string, unknown>>; renal?: Array<Record<string, unknown>>; hepatic?: Array<Record<string, unknown>>; spectrum?: Array<Record<string, unknown>>; calculators?: ApprovedDoseFormula[]; officialProfile?: OfficialMedicationProfile | null; sources?: Array<Record<string, unknown>>; sectionStatuses?: Record<string, string>; doctorReviewRequired: boolean };

export function searchPharmacology(query: string) {
  return request<{ query: string; expandedConcepts: string[]; results: PharmacologySearchResult[]; groupedResults: Array<{ family: string; generics: PharmacologySearchResult[] }>; genericFirst: boolean; tradeNamesAreAliasesOnly: boolean; susceptibilityReviewRequired: boolean }>(`/pharmacology/search?q=${encodeURIComponent(query)}`);
}

export type PharmacologyAtlasGeneric = PharmacologySearchResult;
export type PharmacologyAtlasFamily = { id: string; code: string; name: string; coverageState: "identity-linked-clinical-sections-may-be-incomplete" | "incomplete" | "unlinked"; generics: PharmacologyAtlasGeneric[] };
export type PharmacologyAtlasRoom = { name: string; icon: string; familyCount: number; genericCount: number; fullyProfiledCount: number; partialCount: number; sourceFreshness?: string | null; exampleFamilies: string[]; families: PharmacologyAtlasFamily[]; incompleteFamilies: Array<Omit<PharmacologyAtlasFamily, "generics">> };
export type PharmacologyAtlas = { rooms: PharmacologyAtlasRoom[]; familyDirectory: Array<{ id: string; code: string; name: string; genericCount: number; coverage: string }>; allGenerics: PharmacologyAtlasGeneric[]; unlinkedGenerics: PharmacologyAtlasGeneric[]; recentlyReviewed: PharmacologyAtlasGeneric[]; totals: { families: number; generics: number; linkedGenerics: number; unlinkedGenerics: number; unlinkedRate: number; officialProfiles: number; sourceVerifiedProfiles: number; sourceConflictProfiles: number; populatedRooms: number; familiesBeingCompleted: number }; browseViews: string[]; completeDatasetClaimed: false };

export function getPharmacologyAtlas() {
  return request<PharmacologyAtlas>("/pharmacology/atlas");
}

export function getPharmacologyCoverage() {
  return request<{ generics: number; profiles: Record<string, number>; approvedFormulaVersions: number; completeDatasetClaimed: false; clinicalVerificationClaimed: false }>("/pharmacology/coverage");
}

export function getPharmacologyProfile(id: string) {
  return request<PharmacologyProfile>(`/pharmacology/generics/${encodeURIComponent(id)}`);
}

export type InteractionPairResult = { id: string; primaryGenericId: string; secondaryGenericId: string; severity: string; mechanismText?: string | null; recommendedResponse: string; primaryGeneric?: { genericName: string }; secondaryGeneric?: { genericName: string }; interactingSubstance: string; source?: Record<string, unknown> };

export function getPharmacologyInteractions(ids: string[]) {
  if (!ids.length) return Promise.resolve({ queryIds: [], interactions: [], uniquePairs: 0 });
  return request<{ queryIds: string[]; interactions: InteractionPairResult[]; uniquePairs: number }>(`/pharmacology/interactions?ids=${encodeURIComponent(ids.join(","))}`);
}

export function calculateMedicationFormula(stableId: string, input: Record<string, unknown>) {
  return request<MedicationFormulaResult>(`/calculators/medication/${encodeURIComponent(stableId)}/calculate`, { method: "POST", body: JSON.stringify({ input }) });
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
