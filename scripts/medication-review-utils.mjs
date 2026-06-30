import { prisma } from "./official-medication-utils.mjs";

export { prisma };

export const reviewableStatuses = ["needs_review", "imported"];
export const terminalReviewStatuses = ["verified", "rejected", "retired"];

export const officialCountrySources = {
  BHR: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST",
  OMN: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES"
};

export const highConfidenceThreshold = 0.65;

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
  const [variantsByStatus, openItems, allOpenItems, demoRows, variants, reviewItems] = await Promise.all([
    prisma.drugMarketVariant.groupBy({
      by: ["countryCode", "verificationStatus"],
      where: variantWhere,
      _count: { _all: true }
    }),
    countOpenReviewItems(countryCode),
    prisma.drugMarketManualReviewQueue.count({ where: reviewWhere }),
    prisma.drugMarketVariant.count({ where: { isDemo: true, ...(countryCode ? { countryCode } : {}) } }),
    prisma.drugMarketVariant.findMany({
      where: variantWhere,
      include: { product: true },
      take: 20000
    }),
    prisma.drugMarketManualReviewQueue.findMany({
      where: { queueType: "official_import_review" },
      take: 20000
    })
  ]);
  const duplicateKeys = duplicateRiskKeys(variants);
  const sourceIds = [...new Set(variants.map((variant) => variant.sourceId).filter(Boolean))];
  const sources = sourceIds.length ? await prisma.drugMarketSource.findMany({ where: { id: { in: sourceIds } } }) : [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const rows = variants.map((variant) => classifyVariant(variant, duplicateKeys, sourceById));
  const variantIdSet = new Set(variants.map((variant) => variant.id));
  const scopedReviewItems = countryCode ? reviewItems.filter((item) => item.variantId && variantIdSet.has(item.variantId)) : reviewItems;
  const topMissingFieldReasons = countReasons(rows.flatMap((row) => row.missingFields));
  return {
    countryCode: countryCode ?? "ALL",
    variantsByStatus,
    totals: {
      realRows: variants.length,
      importedOrNeedsReview: rows.filter((row) => reviewableStatuses.includes(row.verificationStatus)).length,
      verified: rows.filter((row) => row.verificationStatus === "verified").length,
      rejected: rows.filter((row) => row.verificationStatus === "rejected").length,
      retired: rows.filter((row) => row.verificationStatus === "retired").length
    },
    byCountry: groupRows(rows, "countryCode"),
    bySource: groupRows(rows, "sourceCode"),
    byImportRun: groupRows(rows, "importRunId"),
    byParserConfidence: {
      highConfidenceCandidates: rows.filter((row) => row.highConfidenceCandidate).length,
      lowConfidenceCandidates: rows.filter((row) => row.lowConfidenceCandidate).length,
      missingParserConfidence: rows.filter((row) => row.parserConfidence === null).length
    },
    missingFields: {
      missingGeneric: rows.filter((row) => row.missingFields.includes("missing_generic")).length,
      missingStrength: rows.filter((row) => row.missingFields.includes("missing_strength")).length,
      missingDosageForm: rows.filter((row) => row.missingFields.includes("missing_dosage_form")).length,
      missingPrice: rows.filter((row) => row.missingFields.includes("missing_price")).length,
      missingRegistrationNumber: rows.filter((row) => row.missingFields.includes("registration_number_missing")).length,
      registrationNumberPresent: rows.filter((row) => row.registrationNumberPresent).length,
      topMissingFieldReasons
    },
    duplicateRiskCount: rows.filter((row) => row.duplicateRisk).length,
    openOfficialReviewItems: openItems,
    openOfficialReviewItemsAllCountries: allOpenItems,
    reviewItemsByStatus: countBy(scopedReviewItems, (item) => item.status),
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
    price: variants.filter((variant) => !(variant.officialPriceAmount || variant.officialPriceText || variant.priceText)).length,
    priceCurrency: variants.filter((variant) => (variant.officialPriceAmount || variant.officialPriceText || variant.priceText) && !variant.currency).length,
    parserConfidence: variants.filter((variant) => variant.parserConfidence === null || variant.parserConfidence === undefined).length,
    officialRowJson: variants.filter((variant) => !variant.officialRowJson).length,
    sourceRowHash: variants.filter((variant) => !variant.sourceRowHash).length
  };
  const unsafe = unsafeMetadataRows(variants);
  const stockOrderCheckoutFields = variants.filter((variant) => hasCommerceFieldKey(variant.officialRowJson ?? {})).length;
  const duplicateKeys = duplicateRiskKeys(variants);
  const rows = variants.map((variant) => classifyVariant(variant, duplicateKeys, source ? new Map([[source.id, source]]) : new Map()));
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
    highConfidenceCandidates: rows.filter((row) => row.highConfidenceCandidate).length,
    lowConfidenceCandidates: rows.filter((row) => row.lowConfidenceCandidate).length,
    duplicateRiskCount: rows.filter((row) => row.duplicateRisk).length,
    missing,
    unsafeMetadataRows: unsafe.length,
    stockOrderCheckoutFields
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

export async function highConfidenceRows({ countryCode, sourceCode, limit = 100 } = {}) {
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
    orderBy: [{ countryCode: "asc" }, { tradeName: "asc" }],
    take: 20000
  });
  const duplicateKeys = duplicateRiskKeys(variants);
  const sourceMap = source ? new Map([[source.id, source]]) : await sourceMapForVariants(variants);
  return variants
    .map((variant) => ({ variant, classification: classifyVariant(variant, duplicateKeys, sourceMap) }))
    .filter((row) => row.classification.highConfidenceCandidate)
    .slice(0, Number(limit) || 100);
}

export async function verifyHighConfidenceBatch({ countryCode, sourceCode, limit = 100, reason, actorUserId = null } = {}) {
  const cleanReason = String(reason ?? "").trim();
  if (cleanReason.length < 10) throw new Error("A verification reason of at least 10 characters is required.");
  const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 1000));
  const rows = await highConfidenceRows({ countryCode, sourceCode, limit: parsedLimit });
  let verified = 0;
  for (const { variant } of rows) {
    await prisma.drugMarketVariant.update({
      where: { id: variant.id },
      data: { verificationStatus: "verified" }
    });
    await prisma.drugMarketManualReviewQueue.updateMany({
      where: { variantId: variant.id, status: "open" },
      data: { status: "verified", resolutionNote: cleanReason }
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "drug_market.variant_verified",
        resourceType: "drug_market_variant",
        resourceId: variant.id,
        severity: "high",
        reason: cleanReason,
        metadataJson: {
          countryCode: variant.countryCode,
          sourceCode,
          importRunId: variant.importRunId,
          batchLimit: parsedLimit,
          highConfidenceBatch: true
        }
      }
    });
    verified += 1;
  }
  return {
    countryCode: countryCode ?? "ALL",
    sourceCode: sourceCode ?? "ALL",
    requestedLimit: parsedLimit,
    verified,
    skippedBecauseNotHighConfidence: Math.max(0, parsedLimit - verified),
    reason: cleanReason
  };
}

export function classifyVariant(variant, duplicateKeys = new Set(), sourceById = new Map()) {
  const missingFields = [];
  if (!variant.genericName) missingFields.push("missing_generic");
  if (!variant.strengthText) missingFields.push("missing_strength");
  if (!variant.dosageForm) missingFields.push("missing_dosage_form");
  if (!(variant.officialPriceAmount || variant.officialPriceText || variant.priceText)) missingFields.push("missing_price");
  if (!variant.registrationNumber) missingFields.push("registration_number_missing");
  if (!variant.sourceId && !variant.importRunId) missingFields.push("missing_source_metadata");
  if (!variant.officialRowJson) missingFields.push("missing_official_row_json");
  if (!variant.sourceRowHash) missingFields.push("missing_source_row_hash");
  const parserConfidence = typeof variant.parserConfidence === "number" ? variant.parserConfidence : Number(variant.parserConfidence ?? NaN);
  const duplicateRisk = duplicateKeys.has(duplicateKey(variant));
  const hasCoreName = Boolean(variant.tradeName || variant.genericName);
  const hasSourceMetadata = Boolean(variant.sourceId && variant.importRunId && variant.officialRowJson && variant.sourceRowHash);
  const highConfidenceCandidate = (
    reviewableStatuses.includes(variant.verificationStatus) &&
    hasCoreName &&
    hasSourceMetadata &&
    !duplicateRisk &&
    Number.isFinite(parserConfidence) &&
    parserConfidence >= highConfidenceThreshold
  );
  return {
    id: variant.id,
    countryCode: variant.countryCode ?? "UNKNOWN",
    sourceCode: sourceById.get(variant.sourceId)?.code ?? "UNKNOWN_SOURCE",
    importRunId: variant.importRunId ?? "NO_IMPORT_RUN",
    verificationStatus: variant.verificationStatus,
    parserConfidence: Number.isFinite(parserConfidence) ? parserConfidence : null,
    missingFields,
    duplicateRisk,
    registrationNumberPresent: Boolean(variant.registrationNumber),
    highConfidenceCandidate,
    lowConfidenceCandidate: !highConfidenceCandidate
  };
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

async function sourceMapForVariants(variants) {
  const sourceIds = [...new Set(variants.map((variant) => variant.sourceId).filter(Boolean))];
  if (!sourceIds.length) return new Map();
  const sources = await prisma.drugMarketSource.findMany({ where: { id: { in: sourceIds } } });
  return new Map(sources.map((source) => [source.id, source]));
}

function unsafeMetadataRows(variants) {
  return variants.filter((variant) => {
    const text = [
      variant.tradeName,
      variant.genericName,
      variant.strengthText,
      variant.dosageForm,
      variant.route,
      variant.packageText,
      variant.officialPriceText,
      JSON.stringify(variant.officialRowJson ?? {})
    ].join(" ");
    return /\b(how to take|take one|take two|dosage instruction|patient instruction|self-medication|checkout|cart|order now|in stock|purchase now)\b/i.test(text);
  });
}

function hasCommerceFieldKey(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, nested] of Object.entries(value)) {
    if (/^(stock|stockStatus|branchStock|order|checkout|cart|purchase|availability)$/i.test(key)) return true;
    if (nested && typeof nested === "object" && hasCommerceFieldKey(nested)) return true;
  }
  return false;
}

function groupRows(rows, key) {
  return Object.entries(countBy(rows, (row) => row[key] ?? "UNKNOWN"))
    .map(([value, count]) => ({ [key]: value, count }))
    .sort((a, b) => b.count - a.count || String(a[key]).localeCompare(String(b[key])));
}

function countReasons(reasons) {
  return Object.entries(countBy(reasons, (reason) => reason))
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function countBy(items, selector) {
  const counts = {};
  for (const item of items) {
    const key = String(selector(item) ?? "UNKNOWN");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
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
