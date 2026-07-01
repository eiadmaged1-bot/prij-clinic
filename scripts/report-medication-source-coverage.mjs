import { prisma } from "./official-medication-utils.mjs";

const sources = await prisma.drugMarketSource.findMany({ where: { active: true }, orderBy: [{ countryCode: "asc" }, { code: "asc" }] });
const rows = [];
for (const source of sources) {
  const [variants, productCount, demoRows, latestSnapshot, reviewItems] = await Promise.all([
    prisma.drugMarketVariant.findMany({ where: { sourceId: source.id, isDemo: false }, select: { id: true, productId: true, countryCode: true, tradeName: true, genericName: true, strengthText: true, dosageForm: true, packageText: true, registrationNumber: true, officialPriceAmount: true, officialPriceText: true, priceText: true, sourceId: true, importRunId: true, officialRowJson: true, sourceRowHash: true, parserConfidence: true, verificationStatus: true } }),
    prisma.drugMarketProduct.count({ where: { isDemo: false, variants: { some: { sourceId: source.id, isDemo: false } } } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: true } }),
    prisma.officialMedicationSourceSnapshot.findFirst({ where: { sourceId: source.id }, orderBy: { fetchedAt: "desc" } }),
    countSourceReviewItems(source.id)
  ]);
  const duplicateKeys = duplicateRiskKeys(variants);
  const highConfidenceCandidates = variants.filter((variant) => isHighConfidenceCandidate(variant, duplicateKeys)).length;
  const lowConfidenceBlocked = variants.filter((variant) => !isHighConfidenceCandidate(variant, duplicateKeys) && ["needs_review", "imported"].includes(variant.verificationStatus)).length;
  const realRows = variants.length;
  const needsReview = variants.filter((variant) => ["needs_review", "imported"].includes(variant.verificationStatus)).length;
  const verifiedRows = variants.filter((variant) => variant.verificationStatus === "verified").length;
  const rejectedRows = variants.filter((variant) => variant.verificationStatus === "rejected").length;
  const retiredRows = variants.filter((variant) => variant.verificationStatus === "retired").length;
  rows.push({
    country: source.countryCode ?? "ALL",
    source: source.code,
    access: source.sourceAccessMode,
    coverage: source.coverageStatus,
    freshness: source.sourceFreshnessStatus,
    realRows,
    products: productCount,
    variants: realRows,
    needsReview,
    reviewItems,
    verifiedRows,
    rejectedRows,
    retiredRows,
    highConfidenceCandidates,
    lowConfidenceBlocked,
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

function isHighConfidenceCandidate(variant, duplicateKeys) {
  return ["needs_review", "imported"].includes(variant.verificationStatus)
    && Boolean(variant.tradeName || variant.genericName)
    && Boolean(variant.sourceId && variant.importRunId && variant.officialRowJson && variant.sourceRowHash)
    && Boolean(variant.genericName || variant.strengthText || variant.dosageForm || variant.packageText || variant.registrationNumber)
    && Number(variant.parserConfidence ?? 0) >= 0.65
    && !hasCommerceFieldKey(variant.officialRowJson)
    && !duplicateKeys.has(duplicateKey(variant));
}

function duplicateRiskKeys(variants) {
  const counts = new Map();
  for (const variant of variants) {
    const key = duplicateKey(variant);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

function duplicateKey(variant) {
  return [variant.countryCode, variant.registrationNumber ?? "", variant.tradeName ?? "", variant.genericName ?? "", variant.strengthText ?? "", variant.dosageForm ?? ""].join("|").toLowerCase();
}

function hasCommerceFieldKey(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, nested] of Object.entries(value)) {
    if (/^(stock|stockStatus|branchStock|order|checkout|cart|purchase|availability)$/i.test(key)) return true;
    if (nested && typeof nested === "object" && hasCommerceFieldKey(nested)) return true;
  }
  return false;
}
