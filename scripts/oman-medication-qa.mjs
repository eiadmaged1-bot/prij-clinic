import { prisma, qaCountry } from "./medication-review-utils.mjs";

try {
  const result = await qaCountry({
    countryCode: "OMN",
    sourceCode: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES"
  });
  console.log(JSON.stringify(result, null, 2));
  const failures = [];
  if (result.realRows !== 5100) failures.push(`Expected 5100 Oman real rows, found ${result.realRows}.`);
  if (result.sourceSnapshots < 1) failures.push("Oman source snapshot is missing.");
  if (result.sourceFileHashRuns < 1) failures.push("Oman source file hash metadata is missing.");
  if (result.missing.tradeOrGeneric > 0) failures.push("Oman rows missing both trade and generic names.");
  if (result.missing.officialRowJson > 0) failures.push("Oman rows missing official row JSON.");
  if (result.missing.parserConfidence > 0) failures.push("Oman rows missing parser confidence.");
  if (result.missing.priceCurrency > 0) failures.push("Oman price rows missing currency.");
  if (result.unsafeMetadataRows > 0) failures.push("Oman rows contain unsafe dosing or purchase wording.");
  if (result.stockOrderCheckoutFields > 0) failures.push("Oman raw fields contain stock/order/checkout/purchase wording.");
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("PASS Oman official medication QA");
  }
} finally {
  await prisma.$disconnect();
}
