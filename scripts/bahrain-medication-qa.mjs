import { prisma, qaCountry } from "./medication-review-utils.mjs";

try {
  const result = await qaCountry({
    countryCode: "BHR",
    sourceCode: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST"
  });
  console.log(JSON.stringify(result, null, 2));
  const failures = [];
  if (result.realRows !== 3169) failures.push(`Expected 3169 Bahrain real rows, found ${result.realRows}.`);
  if (result.needsReview < 3169 && result.verified === 0) failures.push("Bahrain imported rows are not all represented as review-gated or verified.");
  if (result.sourceSnapshots < 1) failures.push("Bahrain source snapshot is missing.");
  if (result.sourceFileHashRuns < 1) failures.push("Bahrain source file hash metadata is missing.");
  if (result.missing.tradeOrGeneric > 0) failures.push("Bahrain rows missing both trade and generic names.");
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("PASS Bahrain official medication QA");
  }
} finally {
  await prisma.$disconnect();
}
