export function parseOfficialPrice(value?: string | null) {
  if (!value) return { amount: null, text: null };
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return { amount: match?.[0] ?? null, text: value };
}
