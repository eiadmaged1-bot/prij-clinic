export function detectSourceDate(value?: string | null) {
  const match = String(value ?? "").match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return new Date(`${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}T00:00:00.000Z`);
}
