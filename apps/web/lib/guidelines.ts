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
  if (!response.ok) throw new Error("Guideline Center is unavailable for this role.");
  return (await response.json()) as T;
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
