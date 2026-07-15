import { getApiBaseUrl } from "./api-base-url";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { credentials: "include", ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error("Could not load patient medication data.");
  return (await response.json()) as T;
}

export type PatientMedicationRecord = { id: string; displayName: string; genericName?: string | null; tradeName?: string | null; strengthText?: string | null; route?: string | null; status: string };
export type PatientAllergyRecord = { id: string; displayName: string; allergyType: string; reactionText?: string | null; severity: string; status: string };

export function listPatientMedications(patientId: string) {
  return request<PatientMedicationRecord[]>(`/patients/${patientId}/medications`);
}

export function addPatientMedication(patientId: string, input: Record<string, string>) {
  return request(`/patients/${patientId}/medications`, { method: "POST", body: JSON.stringify(input) });
}

export function stopPatientMedication(patientId: string, medicationId: string, reason: string) {
  return request(`/patients/${patientId}/medications/${medicationId}/stop`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function listPatientAllergies(patientId: string) {
  return request<PatientAllergyRecord[]>(`/patients/${patientId}/allergies`);
}

export function addPatientAllergy(patientId: string, input: Record<string, string>) {
  return request(`/patients/${patientId}/allergies`, { method: "POST", body: JSON.stringify(input) });
}
