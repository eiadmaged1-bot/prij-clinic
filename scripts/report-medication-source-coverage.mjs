import { prisma } from "./official-medication-utils.mjs";

const sources = await prisma.drugMarketSource.findMany({ where: { active: true }, orderBy: [{ countryCode: "asc" }, { code: "asc" }] });
const rows = [];
for (const source of sources) {
  const [realRows, needsReview, verifiedRows, demoRows] = await Promise.all([
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: false } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: false, verificationStatus: { in: ["needs_review", "imported"] } } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: false, verificationStatus: "verified" } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: true } })
  ]);
  rows.push({
    country: source.countryCode ?? "ALL",
    source: source.code,
    access: source.sourceAccessMode,
    coverage: source.coverageStatus,
    freshness: source.sourceFreshnessStatus,
    realRows,
    needsReview,
    verifiedRows,
    demoRowsExcluded: demoRows,
    lastCheckedAt: source.lastCheckedAt?.toISOString() ?? "",
    lastSuccessfulImportAt: source.lastSuccessfulImportAt?.toISOString() ?? "",
    nextAction: nextAction(source)
  });
}
console.table(rows);
await prisma.$disconnect();

function nextAction(source) {
  if (source.coverageStatus === "blocked_requires_api_approval") return "Approved API access or official upload";
  if (source.coverageStatus === "blocked_requires_official_file") return "Upload official/licensed file";
  if (source.coverageStatus === "failed") return "Configure safe downloader or upload official file";
  if (source.coverageStatus === "not_imported") return "Run discovery/import";
  if (source.coverageStatus === "needs_review" || source.coverageStatus === "partial") return "Review imported rows";
  return "Monitor freshness";
}
