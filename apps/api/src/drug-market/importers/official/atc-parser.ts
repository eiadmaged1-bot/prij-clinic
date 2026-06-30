export function normalizeAtcCode(value?: string | null) {
  return value ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") || null : null;
}
