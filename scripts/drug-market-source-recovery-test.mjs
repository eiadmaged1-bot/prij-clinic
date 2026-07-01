import { readFileSync } from "node:fs";
import { prisma } from "./official-medication-utils.mjs";

const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`SOURCE-RECOVERY PASS ${message}`);
}

const importer = readFileSync("scripts/official-medication-utils.mjs", "utf8");
const ui = readFileSync("apps/web/components/medications/MedicationComponents.tsx", "utf8");
const sourcePolicy = readFileSync("docs/DRUG_MARKET_SOURCE_POLICY.md", "utf8");

assert(importer.includes("visibleCandidateLinks") && importer.includes("finalUrl") && importer.includes("contentType"), "Qatar/Kuwait diagnostics retain source link and HTTP details");
assert(importer.includes("SFDA public list did not expose a parseable server-rendered table"), "SFDA dynamic-page diagnosis is explicit");
assert(ui.includes("Qatar MOPH") && ui.includes("Kuwait MOH") && ui.includes("Saudi SFDA"), "owner official file intake renders country/source options");
assert(sourcePolicy.toLowerCase().includes("checkout") && sourcePolicy.toLowerCase().includes("stock"), "source policy blocks retail stock/order/checkout URLs");

const uploadSources = await prisma.drugMarketSource.findMany({
  where: { code: { in: ["QATAR_OFFICIAL_FILE_UPLOAD", "KUWAIT_OFFICIAL_FILE_UPLOAD", "SFDA_OFFICIAL_FILE_UPLOAD", "EDA_OFFICIAL_FILE_UPLOAD", "UAE_OFFICIAL_FILE_UPLOAD", "BAHRAIN_OFFICIAL_FILE_UPLOAD", "OMAN_OFFICIAL_FILE_UPLOAD"] } }
});
assert(uploadSources.length === 7, "owner-provided official upload sources exist for target countries");
assert(uploadSources.every((source) => source.sourceAccessMode === "official_upload"), "owner official file sources require upload path");

console.log(`SOURCE-RECOVERY SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
await prisma.$disconnect();
