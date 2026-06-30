export function duplicateKey(row: { countryCode?: string | null; tradeName?: string | null; genericName?: string | null; strengthText?: string | null; registrationNumber?: string | null }) {
  return [row.countryCode, row.registrationNumber, row.tradeName, row.genericName, row.strengthText].filter(Boolean).join("|").toLowerCase();
}
