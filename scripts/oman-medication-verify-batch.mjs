import { parseReviewArgs, prisma, verifyHighConfidenceBatch } from "./medication-review-utils.mjs";

const args = parseReviewArgs();
try {
  const result = await verifyHighConfidenceBatch({
    countryCode: "OMN",
    sourceCode: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
    limit: args.limit ?? 100,
    reason: args.reason
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : "Oman verification batch failed."}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
