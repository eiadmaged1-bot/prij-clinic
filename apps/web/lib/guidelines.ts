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
  }).catch(() => null);
  if (!response) throw new GuidelineRequestError("NETWORK_ERROR", "Guideline Center could not reach the API.");
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { code?: string; message?: string; requestId?: string } } | null;
    const code = response.status === 401 ? "SESSION_EXPIRED" : response.status === 403 ? "ACCESS_DENIED" : response.status >= 500 ? "DATABASE_OR_API_ERROR" : body?.error?.code ?? "API_ERROR";
    throw new GuidelineRequestError(code, body?.error?.message ?? "Guideline inventory could not be loaded.", body?.error?.requestId);
  }
  return (await response.json()) as T;
}

export class GuidelineRequestError extends Error {
  constructor(readonly code: string, message: string, readonly requestId?: string) { super(message); }
}

export type GuidelineSource = { id: string; name: string; abbreviation?: string | null; status: string; notes?: string | null; _count?: { documents: number } };
export type GuidelineDocument = { id: string; title: string; reviewStatus: string; citationLabel: string; source?: GuidelineSource; _count?: { sections: number } };
export type Citation = { chunkId: string; text: string; citationLabel: string; documentTitle: string; sourceName: string; reviewStatus: string };

export function listGuidelineSources() {
  return request<GuidelineSource[]>("/guidelines/sources");
}

export function listGuidelineDocuments() {
  return request<GuidelineDocument[]>("/guidelines/documents");
}

export function searchGuidelines(query: string) {
  return request<{ query: string; results: Citation[]; noSourceFound: boolean }>(`/guidelines/search?q=${encodeURIComponent(query)}`);
}

export function askGuidelines(question: string) {
  return request<{ answer: string; citations: Citation[]; externalAiAccess: boolean; doctorReviewRequired: boolean }>("/guidelines/ask", { method: "POST", body: JSON.stringify({ question }) });
}

export function uploadDemoGuidelineText(input: { sourceName: string; title: string; text: string; citationLabel?: string }) {
  return request<GuidelineDocument>("/guidelines/upload-demo-text", { method: "POST", body: JSON.stringify(input) });
}

export function reviewGuidelineDocument(id: string, decision: "APPROVED" | "REJECTED" | "SUPERSEDED" | "ARCHIVED", reason: string) {
  return request<GuidelineDocument>(`/guidelines/documents/${id}/review`, { method: "POST", body: JSON.stringify({ decision, reason }) });
}
