import { prisma } from "./official-medication-utils.mjs";

const sources = await prisma.drugMarketSource.findMany({ where: { active: true }, orderBy: [{ countryCode: "asc" }, { code: "asc" }] });
const rows = [];
for (const source of sources) {
  const [realRows, needsReview, verifiedRows, rejectedRows, retiredRows, demoRows, latestSnapshot, reviewItems] = await Promise.all([
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: false } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: false, verificationStatus: { in: ["needs_review", "imported"] } } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: false, verificationStatus: "verified" } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: false, verificationStatus: "rejected" } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: false, verificationStatus: "retired" } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: true } }),
    prisma.officialMedicationSourceSnapshot.findFirst({ where: { sourceId: source.id }, orderBy: { fetchedAt: "desc" } }),
    countSourceReviewItems(source.id)
  ]);
  rows.push({
    country: source.countryCode ?? "ALL",
    source: source.code,
    access: source.sourceAccessMode,
    coverage: source.coverageStatus,
    freshness: source.sourceFreshnessStatus,
    realRows,
    needsReview,
    reviewItems,
    verifiedRows,
    rejectedRows,
    retiredRows,
    demoRowsExcluded: demoRows,
    lastCheckedAt: source.lastCheckedAt?.toISOString() ?? "",
    lastSuccessfulImportAt: source.lastSuccessfulImportAt?.toISOString() ?? "",
    sourceLabel: source.latestSourceLabel ?? latestSnapshot?.fileName ?? "",
    sourceFileHash: latestSnapshot?.fileSha256 ?? "",
    nextAction: nextAction(source)
  });
}
console.table(rows);
await prisma.$disconnect();

async function countSourceReviewItems(sourceId) {
  const variants = await prisma.drugMarketVariant.findMany({
    where: { sourceId, isDemo: false },
    select: { id: true }
  });
  const ids = variants.map((variant) => variant.id);
  if (!ids.length) return 0;
  return prisma.drugMarketManualReviewQueue.count({
    where: { queueType: "official_import_review", status: "open", variantId: { in: ids } }
  });
}

function nextAction(source) {
  if (source.coverageStatus === "blocked_requires_api_approval") return "Approved API access or official upload";
  if (source.coverageStatus === "blocked_requires_official_file") return "Upload official/licensed file";
  if (source.coverageStatus === "failed") return "Configure safe downloader or upload official file";
  if (source.coverageStatus === "not_imported") return "Run discovery/import";
  if (source.coverageStatus === "needs_review" || source.coverageStatus === "partial") return "Review imported rows";
  return "Monitor freshness";
}
