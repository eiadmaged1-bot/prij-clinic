import { getApiBaseUrl } from "./api-base-url";
import { expandSearchShortcut } from "./search-shortcuts";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { credentials: "include", ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
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
  isDemo?: boolean;
  sourceFreshness?: string | null;
  badges?: string[];
  variantSummary?: Array<{
    id: string;
    countryCode: string;
    strengthText?: string | null;
    dosageForm?: string | null;
    route?: string | null;
    manufacturer?: string | null;
    marketingCompany?: string | null;
    registrationNumber?: string | null;
    atcCode?: string | null;
    officialPriceText?: string | null;
    officialPriceAmount?: string | number | null;
    currency?: string | null;
    sourceFetchedAt?: string | null;
    sourcePublishedAt?: string | null;
    sourceCode?: string | null;
    sourceName?: string | null;
    sourceFreshnessStatus?: string | null;
    parserConfidence?: number | null;
    verificationStatus?: string;
    trustStatus?: string;
    isDemo?: boolean;
  }>;
};

export function searchDrugMarket(query: string, countryCode?: string) {
  return request<{ query: string; products: DrugMarketProduct[] }>("/drug-market/search", { method: "POST", body: JSON.stringify({ query: expandSearchShortcut(query), countryCode }) });
}

export function listDrugMarketCountries() { return request("/drug-market/countries"); }
export function listDrugMarketSources() { return request("/drug-market/sources"); }
export function getDrugMarketProduct(id: string) { return request<DrugMarketProduct & { variants: unknown[]; availabilities: unknown[] }>(`/drug-market/products/${id}`); }
export function listDrugMarketProductVariants(id: string) { return request(`/drug-market/products/${id}/variants`); }
export function getDrugMarketAvailability(id: string) { return request(`/drug-market/products/${id}/availability`); }
export function uploadDrugMarketFile(input: { sourceCode?: string; rows: Array<Record<string, string>>; fileName?: string }) { return request("/drug-market/import/upload", { method: "POST", body: JSON.stringify(input) }); }
export function listDrugMarketImportJobs() { return request("/drug-market/import/jobs"); }
export function getDrugMarketImportJob(id: string) { return request(`/drug-market/import/jobs/${id}`); }
export function listDrugMarketReviewQueue(filters?: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters ?? {})) if (value) params.set(key, value);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request(`/drug-market/review-queue${suffix}`);
}
export function verifyDrugMarketVariant(id: string, reason: string) { return request(`/drug-market/variants/${id}/verify`, { method: "POST", body: JSON.stringify({ reason }) }); }
export function rejectDrugMarketVariant(id: string, reason: string) { return request(`/drug-market/variants/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }); }
export function retireDrugMarketVariant(id: string, reason: string) { return request(`/drug-market/variants/${id}/retire`, { method: "POST", body: JSON.stringify({ reason }) }); }
export function verifyDrugMarketBatch(input: { countryCode: string; sourceCode: string; limit?: number; reason: string; confirmation?: string }) {
  return request("/drug-market/variants/verify-batch", { method: "POST", body: JSON.stringify(input) });
}
export function recomputeDrugMarketAvailability() { return request("/drug-market/import/recompute-availability", { method: "POST" }); }
export function runDrugMarketConnector(id: string) { return request(`/drug-market/automation/connectors/${id}/run`, { method: "POST" }); }
export function dryRunDrugMarketConnector(id: string) { return request(`/drug-market/automation/connectors/${id}/dry-run`, { method: "POST" }); }
export function getDrugMarketCoverage() { return request("/drug-market/automation/coverage"); }
export function listDrugMarketConnectors() { return request("/drug-market/automation/connectors"); }
