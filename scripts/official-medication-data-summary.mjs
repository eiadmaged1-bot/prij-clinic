export const RESTORE_COMPATIBILITY_VERSION = "official-medication-restore-v1";

export async function buildOfficialMedicationSummary(prisma, options = {}) {
  const includeDemo = options.includeDemo === true;
  const variantWhere = includeDemo ? {} : { isDemo: false };
  const realWhere = { isDemo: false };
  const countries = ["BHR", "OMN"];

  const [
    totalRealVariantCount,
    totalRealProductRows,
    demoRowsExcludedCount,
    variantsByCountry,
    variantsByCountryStatus,
    reviewItems,
    reviewItemsByStatus,
    sourceCount,
    importRunCount,
    sourceSnapshotCount,
    sourceRowHashCount,
    officialRowJsonRows,
    officialPriceMetadataByCountry,
    parserRows,
    sources,
    rejectedRetiredByCountry
  ] = await Promise.all([
    prisma.drugMarketVariant.count({ where: realWhere }),
    prisma.drugMarketProduct.count({ where: { isDemo: false, variants: { some: realWhere } } }),
    prisma.drugMarketVariant.count({ where: { isDemo: true } }),
    prisma.drugMarketVariant.groupBy({ by: ["countryCode"], where: variantWhere, _count: { _all: true } }),
    prisma.drugMarketVariant.groupBy({ by: ["countryCode", "verificationStatus"], where: variantWhere, _count: { _all: true } }),
    prisma.drugMarketManualReviewQueue.groupBy({ by: ["status"], where: { queueType: { startsWith: "official" } }, _count: { _all: true } }),
    prisma.drugMarketManualReviewQueue.groupBy({ by: ["queueType", "status"], where: { queueType: { startsWith: "official" } }, _count: { _all: true } }),
    prisma.drugMarketSource.count({ where: { OR: [{ sourceType: "official" }, { sourceType: "official_upload" }, { code: { contains: "OFFICIAL" } }, { code: { contains: "MOH" } }, { code: { contains: "NHRA" } }] } }),
    prisma.drugMarketImportRun.count(),
    prisma.officialMedicationSourceSnapshot.count(),
    prisma.drugMarketVariant.count({ where: { ...variantWhere, sourceRowHash: { not: null } } }),
    prisma.drugMarketVariant.findMany({ where: variantWhere, select: { officialRowJson: true } }),
    prisma.drugMarketVariant.groupBy({ by: ["countryCode"], where: { ...variantWhere, officialPriceText: { not: null }, currency: { not: null } }, _count: { _all: true } }),
    prisma.drugMarketVariant.findMany({ where: variantWhere, select: { countryCode: true, parserConfidence: true, verificationStatus: true, sourceId: true, officialPriceText: true, currency: true } }),
    prisma.drugMarketSource.findMany({ orderBy: [{ countryCode: "asc" }, { code: "asc" }] }),
    prisma.drugMarketVariant.groupBy({ by: ["countryCode", "verificationStatus"], where: { ...variantWhere, verificationStatus: { in: ["rejected", "retired"] } }, _count: { _all: true } })
  ]);

  const countryRowCounts = toCountryCountMap(variantsByCountry);
  const verifiedRowsByCountry = {};
  const needsReviewRowsByCountry = {};
  const rejectedRetiredCountsByCountry = {};
  for (const row of variantsByCountryStatus) {
    if (row.verificationStatus === "verified") verifiedRowsByCountry[row.countryCode] = row._count._all;
    if (row.verificationStatus === "needs_review") needsReviewRowsByCountry[row.countryCode] = row._count._all;
  }
  for (const row of rejectedRetiredByCountry) {
    const current = rejectedRetiredCountsByCountry[row.countryCode] ?? { rejected: 0, retired: 0 };
    current[row.verificationStatus] = row._count._all;
    rejectedRetiredCountsByCountry[row.countryCode] = current;
  }

  const reviewItemsByCountryStatus = {};
  const variantsForReview = await prisma.drugMarketVariant.findMany({
    where: variantWhere,
    select: { id: true, countryCode: true }
  });
  const countryByVariant = new Map(variantsForReview.map((row) => [row.id, row.countryCode]));
  const reviewRows = await prisma.drugMarketManualReviewQueue.findMany({
    where: { variantId: { in: variantsForReview.map((row) => row.id) } },
    select: { status: true, variantId: true }
  });
  for (const item of reviewRows) {
    const countryCode = countryByVariant.get(item.variantId ?? "") ?? "UNKNOWN";
    reviewItemsByCountryStatus[countryCode] ??= {};
    reviewItemsByCountryStatus[countryCode][item.status] = (reviewItemsByCountryStatus[countryCode][item.status] ?? 0) + 1;
  }

  const parserConfidenceBucketsByCountry = {};
  for (const countryCode of countries) parserConfidenceBucketsByCountry[countryCode] = emptyBuckets();
  for (const row of parserRows) {
    const buckets = parserConfidenceBucketsByCountry[row.countryCode] ?? emptyBuckets();
    const value = Number(row.parserConfidence ?? -1);
    if (value >= 0.9) buckets.gte090 += 1;
    else if (value >= 0.8) buckets.gte080 += 1;
    else if (value >= 0.7) buckets.gte070 += 1;
    else if (value >= 0.6) buckets.gte060 += 1;
    else if (value >= 0) buckets.lt060 += 1;
    else buckets.missing += 1;
    parserConfidenceBucketsByCountry[row.countryCode] = buckets;
  }

  const sourceFreshnessSummary = {};
  for (const source of sources) {
    const key = source.countryCode ?? "ALL";
    sourceFreshnessSummary[key] ??= {};
    sourceFreshnessSummary[key][source.sourceFreshnessStatus ?? "unknown"] = (sourceFreshnessSummary[key][source.sourceFreshnessStatus ?? "unknown"] ?? 0) + 1;
  }

  return {
    restoreCompatibilityVersion: RESTORE_COMPATIBILITY_VERSION,
    totalRealProductCount: totalRealProductRows,
    totalRealVariantCount,
    realRowsByCountry: countryRowCounts,
    demoRowsExcludedCount,
    verifiedRowsByCountry,
    needsReviewRowsByCountry,
    reviewItemsByCountryStatus,
    reviewItemsByStatus: Object.fromEntries(reviewItems.map((row) => [row.status, row._count._all])),
    reviewItemsByQueueAndStatus: Object.fromEntries(reviewItemsByStatus.map((row) => [`${row.queueType}:${row.status}`, row._count._all])),
    rejectedRetiredCountsByCountry,
    sourceCount,
    importRunCount,
    sourceSnapshotCount,
    sourceRowHashCount,
    officialRowJsonCount: officialRowJsonRows.filter((row) => row.officialRowJson !== null).length,
    parserConfidenceBucketsByCountry,
    officialPriceMetadataCountByCountry: toCountryCountMap(officialPriceMetadataByCountry),
    sourceFreshnessSummary
  };
}

export function compareMedicationSummaries(expected, actual) {
  const requiredPaths = [
    "totalRealVariantCount",
    "totalRealProductCount",
    "realRowsByCountry",
    "demoRowsExcludedCount",
    "verifiedRowsByCountry",
    "needsReviewRowsByCountry",
    "reviewItemsByCountryStatus",
    "sourceSnapshotCount",
    "importRunCount",
    "sourceRowHashCount",
    "officialPriceMetadataCountByCountry",
    "parserConfidenceBucketsByCountry",
    "rejectedRetiredCountsByCountry"
  ];
  const mismatches = [];
  for (const path of requiredPaths) {
    const left = valueAt(expected, path);
    const right = valueAt(actual, path);
    if (stableStringify(left ?? null) !== stableStringify(right ?? null)) {
      mismatches.push({ path, expected: left ?? null, actual: right ?? null });
    }
  }
  return mismatches;
}

function toCountryCountMap(rows) {
  return Object.fromEntries(rows.map((row) => [row.countryCode, row._count._all]));
}

function emptyBuckets() {
  return { gte090: 0, gte080: 0, gte070: 0, gte060: 0, lt060: 0, missing: 0 };
}

function valueAt(object, path) {
  return path.split(".").reduce((current, key) => current?.[key], object);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
