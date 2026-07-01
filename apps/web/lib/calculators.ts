import { getApiBaseUrl } from "./api-base-url";

function authHeaders() {
  const token = typeof window === "undefined" ? null : sessionStorage.getItem("prijClinicToken");
  return {
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message || "Could not complete calculator request.");
  }

  return response.json() as Promise<T>;
}

export function listCalculatorFormulas() {
  return request<{ formulas: CalculatorFormula[] }>("/calculators/formulas");
}

export function getCalculatorFormula(code: string) {
  return request<CalculatorFormula>(`/calculators/formulas/${encodeURIComponent(code)}`);
}

export function calculateFormula(input: Record<string, unknown>) {
  return request<CalculatorResult>("/calculators/calculate", { method: "POST", body: JSON.stringify(input) });
}

export function listPatientCalculationHistory(patientId: string) {
  return request<{ calculations: PatientCalculation[] }>(`/calculators/history/patient/${patientId}`);
}

export function reviewCalculation(id: string, input: Record<string, unknown> = {}) {
  return request<PatientCalculation>(`/calculators/history/${id}/review`, { method: "POST", body: JSON.stringify(input) });
}

export function voidCalculation(id: string, reason: string) {
  return request<PatientCalculation>(`/calculators/history/${id}/void`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function calculateObDating(input: Record<string, unknown>) {
  return request<PregnancyDatingAssessment>("/calculators/ob/dating/calculate", { method: "POST", body: JSON.stringify(input) });
}

export function getPatientObDating(patientId: string) {
  return request<{ datingAssessments: PregnancyDatingAssessment[] }>(`/calculators/ob/patient/${patientId}/dating`);
}

export function getCurrentPatientObDating(patientId: string) {
  return request<{ dating: PregnancyDatingAssessment | null }>(`/calculators/ob/patient/${patientId}/current`);
}

export function setBestObDating(id: string, input: Record<string, unknown> = {}) {
  return request<PregnancyDatingAssessment>(`/calculators/ob/dating/${id}/set-best`, { method: "POST", body: JSON.stringify(input) });
}

export function lockObDating(id: string, input: Record<string, unknown> = {}) {
  return request<PregnancyDatingAssessment>(`/calculators/ob/dating/${id}/lock`, { method: "POST", body: JSON.stringify(input) });
}

export function changeLockedObDating(id: string, input: Record<string, unknown>) {
  return request<PregnancyDatingAssessment>(`/calculators/ob/dating/${id}/change-locked`, { method: "POST", body: JSON.stringify(input) });
}

export function voidObDating(id: string, reason: string) {
  return request<PregnancyDatingAssessment>(`/calculators/ob/dating/${id}/void`, { method: "POST", body: JSON.stringify({ reason }) });
}

export type CalculatorFormula = {
  id: string;
  code: string;
  name: string;
  category: string;
  specialty?: string | null;
  implementationStatus: string;
  sourceName: string;
  sourceYear?: number | null;
  sourceVersion?: string | null;
  warnings?: string[];
};

export type CalculatorResult = {
  formula: CalculatorFormula;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  units: Record<string, string>;
  calculatedAt: string;
  calculatedBy: { id: string; displayName: string };
  limitations: string[];
  reviewStatus: string;
  history?: PatientCalculation;
};

export type PatientCalculation = {
  id: string;
  status: string;
  calculatedAt: string;
  formula?: CalculatorFormula;
  outputJson?: Record<string, unknown>;
};

export type PregnancyDatingAssessment = {
  id: string;
  patientId: string;
  pregnancyEpisodeId: string;
  datingSource: string;
  calculatedEdd: string;
  confidenceStatus: string;
  isBestObstetricEstimate: boolean;
  isLocked: boolean;
  reviewedByUser?: { displayName?: string | null } | null;
  lockedByUser?: { displayName?: string | null } | null;
  currentGestationalAge?: { display: string; weeks: number; days: number; totalDays: number };
  outputJson?: { gestationalAgeToday?: { display: string } };
};
