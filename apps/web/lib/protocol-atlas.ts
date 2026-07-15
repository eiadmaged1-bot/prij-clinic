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
  if (!response.ok) throw new Error("Could not load protocol atlas.");
  return (await response.json()) as T;
}

export function listProtocolGroups() {
  return request<{ groups: Array<{ name: string; count: number }> }>("/protocol-atlas/groups");
}

export function searchProtocols(input: { query?: string; group?: string; status?: string; riskLevel?: string; verifiedOnly?: boolean }) {
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

export function getProtocolEditor(id: string) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}/editor`);
}

export function updateProtocolSource(id: string, input: { reason: string; sourceName: string; sourceYear?: number; sourceVersion?: string; sourceUrl?: string }) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}/source`, { method: "PATCH", body: JSON.stringify(input) });
}

export function updateProtocolAliases(id: string, input: { reason: string; aliases: string[] }) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}/aliases`, { method: "PATCH", body: JSON.stringify(input) });
}

export function updateStructuredProtocolContent(id: string, input: { reason: string; content: StructuredProtocolContent }) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}/structured-content`, { method: "PATCH", body: JSON.stringify(input) });
}

export function updateProtocolCompletion(id: string, input: { reason: string; questionnaire: Record<string, string[]>; connections: Record<string, string[]> }) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}/completion`, { method: "PATCH", body: JSON.stringify(input) });
}

export function requestProtocolVerification(id: string, reason: string) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}/request-verification`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function verifyProtocol(id: string, reason: string) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}/verify`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function retireProtocol(id: string, reason: string) {
  return request<ClinicalProtocol>(`/protocol-atlas/${id}/retire`, { method: "POST", body: JSON.stringify({ reason }) });
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
  updatedAt?: string;
};

export type ClinicalProtocol = ProtocolSummary & {
  contentJson: unknown;
  sourceUrl?: string | null;
  structuredContent?: StructuredProtocolContent;
  safetyJson?: unknown;
};

export type StructuredProtocolContent = {
  summary: string;
  verifiedManagementAvailable: boolean;
  goals: string[];
  options: string[];
  safetyChecks: string[];
  contraindicationChecks: string[];
  redFlags: string[];
  followUpConsiderations: string[];
  referralConsiderations: string[];
  limitations: string[];
};
