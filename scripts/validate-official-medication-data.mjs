import { prisma } from "./official-medication-utils.mjs";

const failures = [];

const realRows = await prisma.drugMarketVariant.findMany({ where: { isDemo: false }, include: { product: true }, take: 10000 });
for (const row of realRows) {
  if (!row.countryCode) failures.push(`Variant ${row.id} missing countryCode.`);
  if (!row.tradeName && !row.genericName) failures.push(`Variant ${row.id} missing trade/generic name.`);
  if (!row.sourceId && !row.importRunId) failures.push(`Variant ${row.id} missing source/import metadata.`);
  if (!["imported", "needs_review", "verified", "retired"].includes(row.verificationStatus)) failures.push(`Variant ${row.id} has invalid verificationStatus ${row.verificationStatus}.`);
  if ((row.officialPriceAmount || row.officialPriceText || row.priceText) && !row.currency) failures.push(`Variant ${row.id} has price metadata without currency.`);
  const unsafeText = [row.packageText, row.officialRowJson ? JSON.stringify(row.officialRowJson) : ""].join(" ").toLowerCase();
  for (const term of ["take one", "take 1", "how to take", "checkout", "cart", "order now", "branch stock", "in stock"]) {
    if (unsafeText.includes(term)) failures.push(`Variant ${row.id} contains unsafe dosing or purchase wording: ${term}.`);
  }
}

const sources = await prisma.drugMarketSource.findMany();
for (const source of sources) {
  const count = await prisma.drugMarketVariant.count({ where: { sourceId: source.id, isDemo: false } });
  if (count === 0 && ["imported", "verified_subset"].includes(source.coverageStatus)) {
    failures.push(`Source ${source.code} is marked ${source.coverageStatus} with zero real rows.`);
  }
}

const demoCount = await prisma.drugMarketVariant.count({ where: { isDemo: true } });
console.log(`Official medication validation: ${realRows.length} real row(s), ${demoCount} demo row(s) excluded from real counts.`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  await prisma.$disconnect();
  process.exit(1);
}
console.log("PASS official medication data validation");
await prisma.$disconnect();
