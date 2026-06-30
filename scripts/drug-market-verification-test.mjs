import { readFileSync } from "node:fs";
import { highConfidenceRows, reviewSummary, verifyHighConfidenceBatch, prisma } from "./medication-review-utils.mjs";

const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`DRUG-VERIFY PASS ${message}`);
}

try {
  const bahrainSource = await prisma.drugMarketSource.findUnique({ where: { code: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST" } });
  const omanSource = await prisma.drugMarketSource.findUnique({ where: { code: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES" } });
  assert(Boolean(bahrainSource), "Bahrain NHRA source exists");
  assert(Boolean(omanSource), "Oman MOH source exists");

  const [bhrRows, omnRows, realRows, demoRows, bhrReviewItems, omnReviewItems] = await Promise.all([
    prisma.drugMarketVariant.count({ where: { sourceId: bahrainSource?.id, isDemo: false } }),
    prisma.drugMarketVariant.count({ where: { sourceId: omanSource?.id, isDemo: false } }),
    prisma.drugMarketVariant.count({ where: { isDemo: false } }),
    prisma.drugMarketVariant.count({ where: { isDemo: true } }),
    countSourceReviewItems(bahrainSource?.id),
    countSourceReviewItems(omanSource?.id)
  ]);
  assert(bhrRows === 3169, "Bahrain real rows survive seed");
  assert(omnRows === 5100, "Oman real rows survive seed");
  assert(realRows === 8269, "total real rows remain 8269");
  assert(demoRows === 23, "demo rows remain excluded as 23 demo variants");
  assert(bhrReviewItems > 0, "Bahrain review summary remains non-zero");
  assert(omnReviewItems > 0, "Oman review summary remains non-zero");

  const summary = await reviewSummary();
  assert(summary.totals.realRows === 8269, "review summary reports real rows");
  assert(summary.openOfficialReviewItems > 0, "review summary reports open review items");
  assert(summary.byParserConfidence.highConfidenceCandidates > 0, "review summary reports high-confidence candidates");
  assert(summary.byParserConfidence.lowConfidenceCandidates > 0, "review summary reports low-confidence candidates");

  const [bhrHigh, omnHigh] = await Promise.all([
    highConfidenceRows({ countryCode: "BHR", sourceCode: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST", limit: 5 }),
    highConfidenceRows({ countryCode: "OMN", sourceCode: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES", limit: 5 })
  ]);
  assert(bhrHigh.length > 0, "Bahrain has high-confidence verification candidates");
  assert(omnHigh.length === 0, "Oman low-confidence parser rows are not auto-verification candidates");

  let missingReasonFailed = false;
  try {
    await verifyHighConfidenceBatch({ countryCode: "BHR", sourceCode: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST", limit: 1 });
  } catch {
    missingReasonFailed = true;
  }
  assert(missingReasonFailed, "bulk verification without reason fails");

  const controller = readFileSync("apps/api/src/drug-market/drug-market.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/drug-market/drug-market.service.ts", "utf8");
  const importer = readFileSync("scripts/official-medication-utils.mjs", "utf8");
  assert(controller.includes("@Permissions(\"drug_market.verify\")") && controller.includes("variants/verify-batch"), "bulk verification endpoint is RBAC protected");
  assert(service.includes("Large verification batches require the confirmation phrase"), "bulk verification large limit requires confirmation");
  assert(service.includes("drug_market.variant_verified") && service.includes("highConfidenceOnly"), "bulk verification is audited as high-confidence only");
  assert(importer.includes("verified_row_conflict") && importer.includes("Verified official medication row matched a new import"), "verified rows cannot be silently overwritten by official import");

  console.log(`DRUG-VERIFY SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
} finally {
  await prisma.$disconnect();
}

async function countSourceReviewItems(sourceId) {
  if (!sourceId) return 0;
  const variants = await prisma.drugMarketVariant.findMany({ where: { sourceId, isDemo: false }, select: { id: true } });
  const ids = variants.map((variant) => variant.id);
  if (!ids.length) return 0;
  return prisma.drugMarketManualReviewQueue.count({ where: { queueType: "official_import_review", variantId: { in: ids } } });
}
