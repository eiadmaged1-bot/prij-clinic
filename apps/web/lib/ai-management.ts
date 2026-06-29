const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return {
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    credentials: "include",
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) }
  });
  if (!response.ok) throw new Error("Could not complete management snapshot action.");
  return (await response.json()) as T;
}

export function createManagementSnapshot(input: CreateManagementSnapshotInput) {
  return request<ManagementSnapshot>("/ai-management/snapshots", { method: "POST", body: JSON.stringify(input) });
}

export function listManagementSnapshots(patientId: string) {
  return request<{ snapshots: ManagementSnapshot[] }>(`/ai-management/snapshots?patientId=${encodeURIComponent(patientId)}`);
}

export function getManagementSnapshot(id: string) {
  return request<ManagementSnapshot>(`/ai-management/snapshots/${id}`);
}

export function reviewManagementSnapshot(id: string, input: { decision: "approved" | "edited" | "rejected"; doctorEditedPlan?: string; reason?: string }) {
  return request<ManagementSnapshot>(`/ai-management/snapshots/${id}/review`, { method: "POST", body: JSON.stringify(input) });
}

export function saveManagementMemory(id: string, input: { memoryType: string; title: string; valueJson: Record<string, unknown> }) {
  return request<Record<string, unknown>>(`/ai-management/snapshots/${id}/save-memory`, { method: "POST", body: JSON.stringify(input) });
}

export type CreateManagementSnapshotInput = {
  patientId: string;
  encounterId?: string;
  diagnosisText: string;
  protocolCode?: string;
  clinicalGoal?: string;
  age?: number;
  pregnancyStatus?: "unknown" | "not_pregnant" | "pregnant" | "postpartum" | "trying_to_conceive";
  tryingToConceive?: boolean;
  lactating?: boolean;
  previousTreatments?: string;
  contraindications?: string;
  redFlags?: string;
  notes?: string;
};

export type SnapshotOutput = {
  title: string;
  statusLabel: string;
  protocolCode?: string | null;
  implementationStatus: string;
  keyContext: string[];
  guidelineBasedOptions: string[];
  safetyChecks: string[];
  source: { name?: string | null; year?: number | null; version?: string | null; url?: string | null };
  limitations: string[];
  doctorDecisionRequired: boolean;
};

export type ManagementSnapshot = {
  id: string;
  status: string;
  diagnosisText: string;
  clinicalGoal?: string | null;
  outputJson: SnapshotOutput;
  protocol?: { code: string; title: string; implementationStatus: string; sourceName: string } | null;
};
