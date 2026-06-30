import { parseReviewArgs, prisma, verifyHighConfidenceBatch } from "./medication-review-utils.mjs";

const args = parseReviewArgs();
try {
  const result = await verifyHighConfidenceBatch({
    countryCode: "BHR",
    sourceCode: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST",
    limit: args.limit ?? 100,
    reason: args.reason
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : "Bahrain verification batch failed."}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
