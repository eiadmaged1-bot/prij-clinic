export function parseStrengthText(strengthText: string | null | undefined) {
  const original = String(strengthText ?? "").trim();
  const match = original.match(/(\d+(?:\.\d+)?)\s*(mcg|mg|g|iu|units|%)/i);
  return {
    strengthText: original || null,
    strengthValue: match ? Number(match[1]) : null,
    strengthUnit: match ? match[2] : null
  };
}
