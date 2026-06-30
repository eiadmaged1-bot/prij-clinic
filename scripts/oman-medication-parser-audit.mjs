import { prisma, reviewSummary, sampleCountryRows } from "./medication-review-utils.mjs";

const countryCode = "OMN";
const sourceCode = "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES";
const source = await prisma.drugMarketSource.findUnique({ where: { code: sourceCode } });
const sourceId = source?.id;

const variants = await prisma.drugMarketVariant.findMany({
  where: { countryCode, isDemo: false, ...(sourceId ? { sourceId } : {}) },
  include: { product: true },
  take: 20000
});

const reviewItems = await prisma.drugMarketManualReviewQueue.findMany({
  where: { queueType: "official_import_review", status: "open" },
  select: { variantId: true }
});
const reviewVariantIds = new Set(reviewItems.map((item) => item.variantId).filter(Boolean));
const summary = await reviewSummary({ countryCode });

const report = {
  countryCode,
  sourceCode,
  totalOmanRows: variants.length,
  fields: {
    tradeName: count((row) => row.tradeName),
    genericNameOrScientificName: count((row) => row.genericName || row.product?.scientificName),
    strengthText: count((row) => row.strengthText),
    dosageForm: count((row) => row.dosageForm),
    route: count((row) => row.route),
    packOrPackage: count((row) => row.packageText),
    manufacturerOrCompany: count((row) => row.manufacturer || row.marketingCompany),
    registrationNumber: count((row) => row.registrationNumber),
    officialPrice: count((row) => row.officialPriceAmount || row.officialPriceText || row.priceText),
    currencyOMR: variants.filter((row) => row.currency === "OMR").length,
    sourceIdImportRunSourceSnapshot: variants.filter((row) => row.sourceId && row.importRunId && row.sourceFetchedAt).length,
    officialRowJson: count((row) => row.officialRowJson)
  },
  parserConfidenceDistribution: {
    gte090: variants.filter((row) => Number(row.parserConfidence ?? 0) >= 0.9).length,
    gte080: variants.filter((row) => Number(row.parserConfidence ?? 0) >= 0.8).length,
    gte070: variants.filter((row) => Number(row.parserConfidence ?? 0) >= 0.7).length,
    gte060: variants.filter((row) => Number(row.parserConfidence ?? 0) >= 0.6).length,
    lt060: variants.filter((row) => Number(row.parserConfidence ?? 0) < 0.6).length
  },
  topMissingFieldPatterns: summary.missingFields.topMissingFieldReasons,
  highConfidenceCandidateCount: summary.byParserConfidence.highConfidenceCandidates,
  lowConfidenceCandidateCount: summary.byParserConfidence.lowConfidenceCandidates,
  duplicateRiskCount: summary.duplicateRiskCount,
  reviewItemCount: variants.filter((row) => reviewVariantIds.has(row.id)).length,
  sampleHighConfidenceCandidates: await sampleRows(true),
  sampleLowConfidenceRows: await sampleRows(false)
};

console.log(JSON.stringify(report, null, 2));
await prisma.$disconnect();

function count(selector) {
  return variants.filter((row) => Boolean(selector(row))).length;
}

async function sampleRows(highConfidence) {
  const rows = await sampleCountryRows({ countryCode, take: 50 });
  return rows
    .filter((row) => highConfidence ? Number(row.parserConfidence ?? 0) >= 0.65 : Number(row.parserConfidence ?? 0) < 0.65)
    .slice(0, 5);
}
