import { prisma } from "./official-medication-utils.mjs";

const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`OFFICIAL-GCC PASS ${message}`);
}

const bahrainSource = await prisma.drugMarketSource.findUnique({ where: { code: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST" } });
const omanSource = await prisma.drugMarketSource.findUnique({ where: { code: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES" } });
assert(Boolean(bahrainSource), "Bahrain NHRA source exists");
assert(Boolean(omanSource), "Oman MOH price-list source exists");

const [bhrRows, bhrProducts, bhrNeedsReview, bhrVerified, bhrRejected, bhrRetired, bhrReviewItems, omnRows, omnNeedsReview, omnVerified, omnRejected, omnRetired, omnReviewItems, demoRows, fakeFallbackRows] = await Promise.all([
  prisma.drugMarketVariant.count({ where: { sourceId: bahrainSource?.id, isDemo: false } }),
  prisma.drugMarketProduct.count({ where: { isDemo: false, variants: { some: { sourceId: bahrainSource?.id, isDemo: false } } } }),
  prisma.drugMarketVariant.count({ where: { sourceId: bahrainSource?.id, isDemo: false, verificationStatus: "needs_review" } }),
  prisma.drugMarketVariant.count({ where: { sourceId: bahrainSource?.id, isDemo: false, verificationStatus: "verified" } }),
  prisma.drugMarketVariant.count({ where: { sourceId: bahrainSource?.id, isDemo: false, verificationStatus: "rejected" } }),
  prisma.drugMarketVariant.count({ where: { sourceId: bahrainSource?.id, isDemo: false, verificationStatus: "retired" } }),
  countSourceReviewItems(bahrainSource?.id),
  prisma.drugMarketVariant.count({ where: { sourceId: omanSource?.id, isDemo: false } }),
  prisma.drugMarketVariant.count({ where: { sourceId: omanSource?.id, isDemo: false, verificationStatus: "needs_review" } }),
  prisma.drugMarketVariant.count({ where: { sourceId: omanSource?.id, isDemo: false, verificationStatus: "verified" } }),
  prisma.drugMarketVariant.count({ where: { sourceId: omanSource?.id, isDemo: false, verificationStatus: "rejected" } }),
  prisma.drugMarketVariant.count({ where: { sourceId: omanSource?.id, isDemo: false, verificationStatus: "retired" } }),
  countSourceReviewItems(omanSource?.id),
  prisma.drugMarketVariant.count({ where: { isDemo: true } }),
  prisma.drugMarketVariant.count({ where: { isDemo: false, registrationNumber: { startsWith: "DEMO-" } } })
]);

assert(bhrRows === 3169, "Bahrain 3169 real NHRA rows are preserved");
assert(bhrProducts === 1850, "Bahrain product count remains 1850");
assert(bhrNeedsReview + bhrVerified + bhrRejected + bhrRetired === bhrRows, "Bahrain rows are accounted for by review status");
assert(bhrReviewItems === bhrNeedsReview, "Bahrain review queue covers every open review-gated row");
assert(omnRows > 0, "Oman official MOH import has real rows");
assert(omnNeedsReview + omnVerified + omnRejected + omnRetired === omnRows, "Oman rows are accounted for by review status");
assert(omnReviewItems === omnNeedsReview, "Oman review queue covers every open review-gated row");
assert(demoRows >= 1, "demo rows exist but are excluded from real counts");
assert(fakeFallbackRows === 0, "no fake fallback DEMO rows are counted as real");

const unsafe = await prisma.drugMarketVariant.findFirst({
  where: {
    isDemo: false,
    OR: [
      { packageText: { contains: "how to take", mode: "insensitive" } },
      { packageText: { contains: "checkout", mode: "insensitive" } },
      { packageText: { contains: "in stock", mode: "insensitive" } }
    ]
  }
});
assert(!unsafe, "real official metadata avoids dosing and purchase wording");

console.log(`OFFICIAL-GCC SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
await prisma.$disconnect();

async function countSourceReviewItems(sourceId) {
  if (!sourceId) return 0;
  const variants = await prisma.drugMarketVariant.findMany({ where: { sourceId, isDemo: false }, select: { id: true } });
  const ids = variants.map((variant) => variant.id);
  if (!ids.length) return 0;
  return prisma.drugMarketManualReviewQueue.count({ where: { queueType: "official_import_review", status: "open", variantId: { in: ids } } });
}
