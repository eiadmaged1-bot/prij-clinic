import { getApiBaseUrl } from "./api-base-url";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return { ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    headers: authHeaders()
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string; requestId?: string } } | null;
    throw new CaseLibraryRequestError(response.status, body?.error?.message ?? "Could not load case library.", body?.error?.requestId);
  }
  return (await response.json()) as T;
}

export class CaseLibraryRequestError extends Error {
  constructor(readonly status: number, message: string, readonly requestId?: string) { super(message); }
}

export type DoctorSignature = { doctorName: string; doctorColor: string; doctorShortLabel?: string | null; startedAt: string };
export type CaseLibraryCase = {
  id: string;
  patientId: string;
  patientName: string;
  medicalRecordNumber: string;
  visitDateTime: string;
  visitType: string;
  status: string;
  patientType?: string | null;
  summaryPreview: string;
  tags: string[];
  doctorSignature: DoctorSignature;
  links: { patient: string; visit: string };
};

export function listCaseLibrary(params: Record<string, string>) {
  const search = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
  return request<{ cases: CaseLibraryCase[]; canViewAll: boolean; scope: string }>(`/doctor/case-library?${search.toString()}`);
}

export function listCaseLibraryDoctors() {
  return request<{ id: string; displayName: string; doctorColor?: string | null; doctorShortLabel?: string | null }[]>("/doctor/case-library/doctors");
}
