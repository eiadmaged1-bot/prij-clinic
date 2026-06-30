import { normalizeMedicationSearch } from "./normalize-medication-search";

export function classMatches(query: string, familyText: string) {
  return normalizeMedicationSearch(familyText).includes(normalizeMedicationSearch(query));
}
