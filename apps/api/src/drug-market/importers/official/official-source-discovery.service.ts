export const officialSourceDiscoveryPolicy =
  "Discover explicit configured official PDF/XLSX/CSV/JSON files first, then visible official-domain file links only; no login, CAPTCHA, paywall, or brute-force enumeration.";

export const officialSourceDiscoveryCapabilities = [
  "official-domain allowlist",
  "visible file-link discovery",
  "direct XLSX/PDF/CSV/JSON candidate support",
  "blocked protected/retail URL patterns",
  "source change reported as blocked_source_changed or failed"
];
