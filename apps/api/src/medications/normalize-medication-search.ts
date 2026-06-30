export function normalizeMedicationSearch(value: string | null | undefined) {
  const base = String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}%/.\s-]+/gu, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return base
    .replace(/\bacei\b/g, "ace inhibitor acei")
    .replace(/\barb\b/g, "angiotensin receptor blocker arb sartans")
    .replace(/\bccb\b/g, "calcium channel blocker ccb")
    .replace(/\bnsaid\b/g, "nsaid non steroidal anti inflammatory drug")
    .replace(/\bssri\b/g, "selective serotonin reuptake inhibitor ssri")
    .replace(/\bppi\b/g, "proton pump inhibitor ppi");
}

export function includesQuery(searchText: string | null | undefined, query: string) {
  if (!query) return true;
  return normalizeMedicationSearch(searchText).includes(query);
}
