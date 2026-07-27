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
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { code?: string; message?: string | string[]; error?: { code?: string; message?: string } };
    const message = Array.isArray(payload.message) ? payload.message.join(" ") : payload.message ?? payload.error?.message ?? "Could not update the doctor visit workflow.";
    const error = new Error(message);
    Object.assign(error, { status: response.status, code: payload.code ?? payload.error?.code });
    throw error;
  }
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
  recentEncounters?: Record<string, unknown>[];
  pregnancyEpisode?: Record<string, unknown> | null;
  infertilityEpisode?: Record<string, unknown> | null;
  warning?: string;
};

export function startDoctorVisit(patientId: string, queueTicketId?: string) {
  return request<DoctorVisitState>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/start`, { method: "POST", body: JSON.stringify(queueTicketId ? { queueTicketId } : {}) });
}

export function getCurrentDoctorVisit(patientId: string) {
  return request<DoctorVisitState>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/current`);
}

export function updateDoctorVisit(patientId: string, encounterId: string, input: Record<string, unknown>, expectedUpdatedAt?: string) {
  return request<Record<string, unknown>>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}`, { method: "PATCH", body: JSON.stringify({ ...input, ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}) }) });
}

export function createDoctorVisitFollowUp(patientId: string, encounterId: string, input: { dueAt?: string; title?: string; note?: string }, idempotencyKey?: string) {
  return request<Record<string, unknown>>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}/follow-up`, { method: "POST", headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined, body: JSON.stringify(input) });
}

export function getDoctorVisitPacket(patientId: string, encounterId: string) {
  return request<DoctorVisitState>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}/packet`);
}

export function completeDoctorVisit(patientId: string, encounterId: string) {
  return request<Record<string, unknown>>(`/encounters/${encodeURIComponent(encounterId)}/sign`, { method: "PATCH", body: JSON.stringify({ patientId }) });
}
