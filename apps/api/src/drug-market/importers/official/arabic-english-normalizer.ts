export function normalizeArabicEnglishText(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}
