export const officialSourceFetcherPolicy =
  "Fetch official public direct files only, record status/final URL/content type/last-modified/hash/fetchedAt, and store raw source files under ignored storage/official-medication-sources.";

export const officialSourceFetcherBlockedPatterns = [
  "login",
  "captcha",
  "paywall",
  "checkout",
  "cart",
  "order",
  "stock",
  "purchase"
];
