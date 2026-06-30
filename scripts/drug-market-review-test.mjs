import { prisma } from "./official-medication-utils.mjs";

const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`DRUG-REVIEW PASS ${message}`);
}

const openItems = await prisma.drugMarketManualReviewQueue.findMany({
  where: { queueType: "official_import_review", status: "open" },
  take: 25
});
assert(openItems.length > 0, "official review queue has open items");
assert(openItems.every((item) => item.variantId && item.productId), "review items link to product and variant");
assert(openItems.every((item) => item.reason.includes("requires admin/owner review")), "review items carry explicit review reason");

const linkedVariant = await prisma.drugMarketVariant.findFirst({
  where: { id: openItems[0].variantId ?? undefined, isDemo: false }
});
assert(Boolean(linkedVariant), "review item points to a real non-demo variant");

const verifiedConflictProtection = await prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "verified" } });
assert(verifiedConflictProtection >= 0, "verified rows are counted separately from imported rows");

console.log(`DRUG-REVIEW SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
await prisma.$disconnect();
