export function normalizeRoute(value: string | null | undefined) {
  const text = String(value ?? "").toLowerCase().trim();
  if (["po", "oral"].includes(text)) return "oral";
  if (["iv", "intravenous"].includes(text)) return "intravenous";
  if (["im", "intramuscular"].includes(text)) return "intramuscular";
  return text || null;
}
