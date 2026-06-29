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
  if (!response.ok) throw new Error("Could not load protocol atlas.");
  return (await response.json()) as T;
}

export function listProtocolGroups() {
  return request<{ groups: Array<{ name: string; count: number }> }>("/protocol-atlas/groups");
}

export function searchProtocols(input: { query?: string; group?: string }) {
  return request<{ protocols: ProtocolSummary[] }>("/protocol-atlas/search", { method: "POST", body: JSON.stringify(input) });
}

export function getProtocol(id: string) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}`);
}

export function getProtocolByCode(code: string) {
  return request<ClinicalProtocol>(`/protocol-atlas/by-code/${code}`);
}

export function updateProtocolStatus(id: string, input: { implementationStatus: string; reason: string; sourceName?: string; sourceYear?: number; sourceVersion?: string; sourceUrl?: string }) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}/status`, { method: "PATCH", body: JSON.stringify(input) });
}

export type ProtocolSummary = {
  id: string;
  code: string;
  title: string;
  specialtyGroup: string;
  condition: string;
  aliases: string[];
  implementationStatus: string;
  riskLevel: string;
  sourceName: string;
  sourceYear?: number | null;
  sourceVersion?: string | null;
};

export type ClinicalProtocol = ProtocolSummary & {
  contentJson: unknown;
  safetyJson?: unknown;
};
