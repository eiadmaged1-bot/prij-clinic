import { getApiBaseUrl } from "./api-base-url";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) }
  });
  if (!response.ok) throw new Error("Could not update the doctor visit workflow.");
  return (await response.json()) as T;
}

export type DoctorVisitState = {
  workflow: string[];
  patient?: Record<string, unknown>;
  encounter?: Record<string, unknown> | null;
  historySheet?: Record<string, unknown> | null;
  careAssistFindings?: Record<string, unknown>[];
  prescriptions?: Record<string, unknown>[];
  investigationOrders?: Record<string, unknown>[];
  followUps?: Record<string, unknown>[];
  warning?: string;
};

export function startDoctorVisit(patientId: string) {
  return request<DoctorVisitState>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/start`, { method: "POST", body: JSON.stringify({}) });
}

export function getCurrentDoctorVisit(patientId: string) {
  return request<DoctorVisitState>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/current`);
}

export function updateDoctorVisit(patientId: string, encounterId: string, input: Record<string, string>) {
  return request<Record<string, unknown>>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function createDoctorVisitFollowUp(patientId: string, encounterId: string, input: { dueAt?: string; title?: string; note?: string }) {
  return request<Record<string, unknown>>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}/follow-up`, { method: "POST", body: JSON.stringify(input) });
}

export function getDoctorVisitPacket(patientId: string, encounterId: string) {
  return request<DoctorVisitState>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}/packet`);
}
