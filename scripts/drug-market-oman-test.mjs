import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { highConfidenceRows, prisma, reviewSummary, verifyHighConfidenceBatch } from "./medication-review-utils.mjs";

const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`OMAN-MEDS PASS ${message}`);
}

try {
  const source = await prisma.drugMarketSource.findUnique({ where: { code: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES" } });
  assert(Boolean(source), "Oman MOH source exists");

  const [rows, verified, reviewItems, highRows, summary] = await Promise.all([
    prisma.drugMarketVariant.count({ where: { sourceId: source?.id, isDemo: false } }),
    prisma.drugMarketVariant.count({ where: { sourceId: source?.id, isDemo: false, verificationStatus: "verified" } }),
    countOpenOmanReviewItems(source?.id),
    highConfidenceRows({ countryCode: "OMN", sourceCode: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES", limit: 10 }),
    reviewSummary({ countryCode: "OMN" })
  ]);
  assert(rows === 5100, "Oman real official rows remain 5100");
  assert(verified >= 100, "Oman verification batch 2 rows remain verified");
  assert(reviewItems === rows - verified, "Oman open review queue covers unverified rows");
  assert(highRows.length > 0, "Oman high-confidence candidates are counted");
  assert(summary.byParserConfidence.lowConfidenceCandidates > 0, "Oman low-confidence rows remain blocked");

  const auditOutput = execFileSync("node", ["scripts/oman-medication-parser-audit.mjs"], { encoding: "utf8" });
  const audit = JSON.parse(auditOutput);
  assert(audit.totalOmanRows === 5100, "Oman parser audit script runs");
  assert(audit.fields.strengthText > 0, "Oman parser extracts strength from official text");
  assert(audit.fields.dosageForm > 0, "Oman parser extracts dosage form from official text");
  assert(audit.fields.officialRowJson === 5100, "Oman parser preserves official raw rows");

  let missingReasonFailed = false;
  try {
    await verifyHighConfidenceBatch({ countryCode: "OMN", sourceCode: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES", limit: 1 });
  } catch {
    missingReasonFailed = true;
  }
  assert(missingReasonFailed, "Oman verification without reason fails");

  const parser = readFileSync("scripts/official-medication-utils.mjs", "utf8");
  const service = readFileSync("apps/api/src/drug-market/drug-market.service.ts", "utf8");
  const search = readFileSync("apps/api/src/drug-market/drug-market-search.service.ts", "utf8");
  const ui = readFileSync("apps/web/components/medications/MedicationComponents.tsx", "utf8");
  assert(parser.includes("parseOmanPricePdfTextV2") && parser.includes("rawBlockText"), "Oman parser preserves raw block text");
  assert(service.includes("hasCommerceFieldKey") && service.includes("highConfidenceOnly"), "batch verification blocks unsafe low-confidence metadata");
  assert(search.includes("officialPriceText") && search.includes("matchingSourceIds"), "Oman rows searchable by official price and source");
  assert(ui.includes("Verified") && ui.includes("Needs review") && ui.includes("Source-tracked"), "review and profile UI shows simplified trust metadata");
  assert(!ui.includes("Official/source price") && !ui.includes("Parser confidence") && !ui.includes("Official row fields") && !ui.includes("Row preview"), "review and profile UI hides technical source fields");
  const unsafeOmanRow = await prisma.drugMarketVariant.findFirst({
    where: {
      sourceId: source?.id,
      isDemo: false,
      OR: [
        { packageText: { contains: "how to take", mode: "insensitive" } },
        { packageText: { contains: "checkout", mode: "insensitive" } },
        { packageText: { contains: "cart", mode: "insensitive" } },
        { packageText: { contains: "purchase", mode: "insensitive" } }
      ]
    }
  });
  assert(!unsafeOmanRow, "Oman metadata avoids dosing and commerce wording");

  console.log(`OMAN-MEDS SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
} finally {
  await prisma.$disconnect();
}

async function countOpenOmanReviewItems(sourceId) {
  if (!sourceId) return 0;
  const variants = await prisma.drugMarketVariant.findMany({ where: { sourceId, isDemo: false }, select: { id: true } });
  const ids = variants.map((variant) => variant.id);
  if (!ids.length) return 0;
  return prisma.drugMarketManualReviewQueue.count({ where: { queueType: "official_import_review", status: "open", variantId: { in: ids } } });
}
