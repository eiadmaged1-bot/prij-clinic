export function normalizeMedicationSearch(value: string | null | undefined) {
  const base = String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}%/.\s-]+/gu, " ")
    .replace(/[-_]+/g, " ")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

  return base
    .replace(/\bacei\b/g, "ace inhibitor acei")
    .replace(/\barb\b/g, "angiotensin receptor blocker arb sartans")
    .replace(/\bccb\b/g, "calcium channel blocker ccb")
    .replace(/\bnsaid\b/g, "non steroidal anti inflammatory drug nsaid")
    .replace(/\bssri\b/g, "selective serotonin reuptake inhibitor ssri")
    .replace(/\bppi\b/g, "proton pump inhibitor ppi");
}

export function includesQuery(searchText: string | null | undefined, query: string) {
  if (!query) return true;
  return normalizeMedicationSearch(searchText).includes(query);
}
