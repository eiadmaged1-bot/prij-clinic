import { parseReviewArgs, prisma, verifyHighConfidenceBatch } from "./medication-review-utils.mjs";

const args = parseReviewArgs();
try {
  const result = await verifyHighConfidenceBatch({
    countryCode: args.country ? String(args.country).toUpperCase() : undefined,
    sourceCode: args.source,
    limit: args.limit ?? 100,
    reason: args.reason
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : "Verification batch failed."}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
