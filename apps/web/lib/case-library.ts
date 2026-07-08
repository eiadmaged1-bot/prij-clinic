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
  if (!response.ok) throw new Error("Could not load case library.");
  return (await response.json()) as T;
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
