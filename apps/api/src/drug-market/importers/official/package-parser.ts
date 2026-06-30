export function normalizePackageText(value?: string | null) {
  return value ? value.replace(/\s+/g, " ").trim() : null;
}
