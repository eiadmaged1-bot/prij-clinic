import { prisma } from "./official-medication-utils.mjs";

export { prisma };

export const reviewableStatuses = ["needs_review", "imported"];

export function parseReviewArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) args[key] = "true";
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export async function rebuildReviewQueue({ countryCode, sourceCode } = {}) {
  const source = sourceCode ? await prisma.drugMarketSource.findUnique({ where: { code: sourceCode } }) : null;
  const where = {
    isDemo: false,
    verificationStatus: { in: reviewableStatuses },
    ...(countryCode ? { countryCode } : {}),
    ...(source?.id ? { sourceId: source.id } : {})
  };
  const variants = await prisma.drugMarketVariant.findMany({
    where,
    include: { product: true },
    orderBy: [{ countryCode: "asc" }, { tradeName: "asc" }]
  });
  const duplicateKeys = duplicateRiskKeys(variants);
  const variantIds = variants.map((variant) => variant.id);
  for (const chunk of chunks(variantIds, 500)) {
    await prisma.drugMarketManualReviewQueue.deleteMany({
      where: { queueType: "official_import_review", variantId: { in: chunk }, status: "open" }
    });
  }
  const rows = variants.map((variant) => ({
    queueType: "official_import_review",
    productId: variant.productId,
    variantId: variant.id,
    status: "open",
    reason: buildReviewReason(variant, duplicateKeys)
  }));
  for (const chunk of chunks(rows, 500)) {
    if (chunk.length) await prisma.drugMarketManualReviewQueue.createMany({ data: chunk });
  }
  return {
    countryCode: countryCode ?? "ALL",
    sourceCode: source?.code ?? sourceCode ?? "ALL",
    variantsScanned: variants.length,
    reviewItemsCreated: rows.length,
    duplicateRiskCount: rows.filter((row) => row.reason.includes("duplicate risk")).length,
    missingCoreFieldCount: rows.filter((row) => row.reason.includes("missing")).length,
    lowConfidenceCount: variants.filter((variant) => Number(variant.parserConfidence ?? 0) < 0.65).length
  };
}

export async function reviewSummary({ countryCode } = {}) {
  const variantWhere = { isDemo: false, ...(countryCode ? { countryCode } : {}) };
  const reviewWhere = { queueType: "official_import_review", status: "open" };
  const [variantsByStatus, openItems, allOpenItems, demoRows] = await Promise.all([
    prisma.drugMarketVariant.groupBy({
      by: ["countryCode", "verificationStatus"],
      where: variantWhere,
      _count: { _all: true }
    }),
    countOpenReviewItems(countryCode),
    prisma.drugMarketManualReviewQueue.count({ where: reviewWhere }),
    prisma.drugMarketVariant.count({ where: { isDemo: true, ...(countryCode ? { countryCode } : {}) } })
  ]);
  return {
    countryCode: countryCode ?? "ALL",
    variantsByStatus,
    openOfficialReviewItems: openItems,
    openOfficialReviewItemsAllCountries: allOpenItems,
    demoRowsExcluded: demoRows
  };
}

export async function qaCountry({ countryCode, sourceCode } = {}) {
  const source = sourceCode ? await prisma.drugMarketSource.findUnique({ where: { code: sourceCode } }) : null;
  const where = { isDemo: false, ...(countryCode ? { countryCode } : {}), ...(source?.id ? { sourceId: source.id } : {}) };
  const variants = await prisma.drugMarketVariant.findMany({ where, include: { product: true }, take: 20000 });
  const snapshots = await prisma.officialMedicationSourceSnapshot.count({
    where: { ...(countryCode ? { countryCode } : {}), ...(source?.id ? { sourceId: source.id } : {}) }
  });
  const hashes = await prisma.drugMarketImportRun.count({
    where: { ...(source?.id ? { sourceId: source.id } : {}), sourceFileSha256: { not: null } }
  });
  const missing = {
    tradeOrGeneric: variants.filter((variant) => !variant.tradeName && !variant.genericName).length,
    source: variants.filter((variant) => !variant.sourceId && !variant.importRunId).length,
    strength: variants.filter((variant) => !variant.strengthText).length,
    form: variants.filter((variant) => !variant.dosageForm).length,
    priceCurrency: variants.filter((variant) => (variant.officialPriceAmount || variant.officialPriceText || variant.priceText) && !variant.currency).length
  };
  const reviewItems = await countOpenReviewItems(countryCode);
  return {
    countryCode: countryCode ?? "ALL",
    sourceCode: source?.code ?? sourceCode ?? "ALL",
    realRows: variants.length,
    products: new Set(variants.map((variant) => variant.productId)).size,
    needsReview: variants.filter((variant) => reviewableStatuses.includes(variant.verificationStatus)).length,
    verified: variants.filter((variant) => variant.verificationStatus === "verified").length,
    retired: variants.filter((variant) => variant.verificationStatus === "retired").length,
    openReviewItems: reviewItems,
    sourceSnapshots: snapshots,
    sourceFileHashRuns: hashes,
    missing
  };
}

export async function sampleCountryRows({ countryCode, take = 10 } = {}) {
  return prisma.drugMarketVariant.findMany({
    where: { isDemo: false, ...(countryCode ? { countryCode } : {}) },
    select: {
      id: true,
      countryCode: true,
      tradeName: true,
      genericName: true,
      strengthText: true,
      dosageForm: true,
      route: true,
      packageText: true,
      registrationNumber: true,
      officialPriceText: true,
      officialPriceAmount: true,
      currency: true,
      verificationStatus: true,
      parserConfidence: true,
      sourceFetchedAt: true
    },
    orderBy: [{ tradeName: "asc" }],
    take: Number(take) || 10
  });
}

function buildReviewReason(variant, duplicateKeys) {
  const reasons = ["Imported official medication row requires admin/owner review before verification"];
  if (!variant.genericName) reasons.push("missing generic/scientific name");
  if (!variant.strengthText) reasons.push("missing strength");
  if (!variant.dosageForm) reasons.push("missing dosage form");
  if (!variant.sourceId && !variant.importRunId) reasons.push("missing source metadata");
  if ((variant.officialPriceAmount || variant.officialPriceText || variant.priceText) && !variant.currency) reasons.push("missing price currency");
  if (Number(variant.parserConfidence ?? 0) < 0.65) reasons.push("low parser confidence");
  if (duplicateKeys.has(duplicateKey(variant))) reasons.push("duplicate risk");
  return `${variant.countryCode}: ${reasons.join("; ")}.`;
}

function duplicateRiskKeys(variants) {
  const counts = new Map();
  for (const variant of variants) {
    const key = duplicateKey(variant);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

function duplicateKey(variant) {
  return [
    variant.countryCode,
    variant.registrationNumber || "",
    variant.tradeName || "",
    variant.genericName || "",
    variant.strengthText || "",
    variant.dosageForm || ""
  ].join("|").toLowerCase();
}

async function countOpenReviewItems(countryCode) {
  if (!countryCode) {
    return prisma.drugMarketManualReviewQueue.count({ where: { queueType: "official_import_review", status: "open" } });
  }
  const rows = await prisma.drugMarketManualReviewQueue.findMany({
    where: { queueType: "official_import_review", status: "open" },
    select: { variantId: true }
  });
  const ids = rows.map((row) => row.variantId).filter(Boolean);
  if (!ids.length) return 0;
  return prisma.drugMarketVariant.count({ where: { id: { in: ids }, countryCode, isDemo: false } });
}

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}
