import { getApiBaseUrl } from "./api-base-url";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

export class DoctorVisitRequestError extends Error {
  constructor(public readonly status: number, public readonly payload: Record<string, unknown>) {
    super(String(payload.message ?? "Could not update the doctor visit workflow."));
    this.name = "DoctorVisitRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    throw new DoctorVisitRequestError(response.status, payload);
  }
  return (await response.json()) as T;
}

export type EncounterReadinessIssue = {
  code: string;
  section: "encounter" | "history" | "examination" | "assessment" | "plan";
  severity: "blocking" | "warning";
  message: string;
};

export type EncounterReadiness = {
  encounterId: string;
  revision: string;
  status: string;
  ready: boolean;
  issues: EncounterReadinessIssue[];
};
export type DoctorVisitState = {
  workflow: string[];
  patient?: Record<string, unknown>;
  encounter?: Record<string, unknown> | null;
  historySheet?: Record<string, unknown> | null;
  careAssistFindings?: Record<string, unknown>[];
  prescriptions?: Record<string, unknown>[];
  investigationOrders?: Record<string, unknown>[];
  ultrasounds?: Record<string, unknown>[];
  followUps?: Record<string, unknown>[];
  recentEncounters?: Record<string, unknown>[];
  pregnancyEpisode?: Record<string, unknown> | null;
  infertilityEpisode?: Record<string, unknown> | null;
  warning?: string;
  resourceErrors?: Array<{ resource: string; message: string }>;
};

export function startDoctorVisit(patientId: string) {
  return request<DoctorVisitState>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/start`, { method: "POST", body: JSON.stringify({}) });
}

export function getCurrentDoctorVisit(patientId: string) {
  return request<DoctorVisitState>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/current`);
}

export function updateDoctorVisit(patientId: string, encounterId: string, input: Record<string, unknown>, revision?: string) {
  return request<Record<string, unknown>>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}`, { method: "PATCH", body: JSON.stringify({ ...input, ...(revision ? { revision } : {}) }) });
}

export function createDoctorVisitFollowUp(patientId: string, encounterId: string, input: { dueAt?: string; title?: string; note?: string }, idempotencyKey?: string) {
  return request<Record<string, unknown>>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}/follow-up`, { method: "POST", headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined, body: JSON.stringify(input) });
}

export function getDoctorVisitPacket(patientId: string, encounterId: string) {
  return request<DoctorVisitState>(`/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}/packet`);
}

export function getEncounterReadiness(encounterId: string) {
  return request<EncounterReadiness>(`/encounters/${encodeURIComponent(encounterId)}/readiness`);
}

export function completeDoctorVisit(encounterId: string, expectedRevision: string) {
  return request<Record<string, unknown>>(`/encounters/${encodeURIComponent(encounterId)}/sign`, { method: "PATCH", body: JSON.stringify({ expectedRevision }) });
}
