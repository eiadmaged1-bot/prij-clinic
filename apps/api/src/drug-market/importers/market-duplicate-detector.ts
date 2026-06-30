export function duplicateKey(row: { countryCode?: string; tradeName?: string; genericName?: string; strengthText?: string }) {
  return [row.countryCode, row.tradeName, row.genericName, row.strengthText].map((item) => item?.toLowerCase().trim() ?? "").join("|");
}
