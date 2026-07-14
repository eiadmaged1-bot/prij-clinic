export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function keywords(value: string) {
  return [...new Set(normalizeText(value).split(" ").filter((word) => word.length > 1))];
}
