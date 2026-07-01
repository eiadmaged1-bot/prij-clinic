import { getApiBaseUrl } from "./api-base-url";

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
  route?: string | null;
  dosageForm?: string | null;
  strengthText?: string | null;
  verificationStatus?: string | null;
};

export function searchMedications(query: string) {
  return request<{ query: string; results: MedicationResult[] }>("/medications/search", {
    method: "POST",
    body: JSON.stringify({ query })
  });
}

export function listDrugFamilies() {
  return request<Array<{ id: string; code: string; displayName: string; aliases?: string[]; verificationStatus: string }>>("/medications/families");
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
