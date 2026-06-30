const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { credentials: "include", ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error("Could not load drug market data.");
  return (await response.json()) as T;
}

export type DrugMarketProduct = {
  id: string;
  tradeName: string;
  genericName?: string | null;
  scientificName?: string | null;
  family?: string | null;
  verificationStatus?: string;
  badges?: string[];
  variantSummary?: Array<{ id: string; countryCode: string; strengthText?: string | null; dosageForm?: string | null; route?: string | null; verificationStatus?: string }>;
};

export function searchDrugMarket(query: string, countryCode?: string) {
  return request<{ query: string; products: DrugMarketProduct[] }>("/drug-market/search", { method: "POST", body: JSON.stringify({ query, countryCode }) });
}

export function listDrugMarketCountries() { return request("/drug-market/countries"); }
export function listDrugMarketSources() { return request("/drug-market/sources"); }
export function getDrugMarketProduct(id: string) { return request<DrugMarketProduct & { variants: unknown[]; availabilities: unknown[] }>(`/drug-market/products/${id}`); }
export function listDrugMarketProductVariants(id: string) { return request(`/drug-market/products/${id}/variants`); }
export function getDrugMarketAvailability(id: string) { return request(`/drug-market/products/${id}/availability`); }
export function uploadDrugMarketFile(input: { sourceCode?: string; rows: Array<Record<string, string>>; fileName?: string }) { return request("/drug-market/import/upload", { method: "POST", body: JSON.stringify(input) }); }
export function listDrugMarketImportJobs() { return request("/drug-market/import/jobs"); }
export function getDrugMarketImportJob(id: string) { return request(`/drug-market/import/jobs/${id}`); }
export function listDrugMarketReviewQueue() { return request("/drug-market/review-queue"); }
export function verifyDrugMarketVariant(id: string) { return request(`/drug-market/variants/${id}/verify`, { method: "POST" }); }
export function retireDrugMarketVariant(id: string) { return request(`/drug-market/variants/${id}/retire`, { method: "POST" }); }
export function recomputeDrugMarketAvailability() { return request("/drug-market/import/recompute-availability", { method: "POST" }); }
export function runDrugMarketConnector(id: string) { return request(`/drug-market/automation/connectors/${id}/run`, { method: "POST" }); }
export function dryRunDrugMarketConnector(id: string) { return request(`/drug-market/automation/connectors/${id}/dry-run`, { method: "POST" }); }
export function getDrugMarketCoverage() { return request("/drug-market/automation/coverage"); }
export function listDrugMarketConnectors() { return request("/drug-market/automation/connectors"); }
