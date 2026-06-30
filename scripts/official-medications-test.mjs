import { existsSync, readFileSync } from "node:fs";
import { prisma } from "./official-medication-utils.mjs";

const requiredSources = [
  "EDA_EDDB_SEARCH",
  "EDA_EGYPTIAN_DRUG_REGISTER",
  "EDA_OFFICIAL_FILE_UPLOAD",
  "SFDA_DRUGS_LIST",
  "SFDA_OFFICIAL_FILE_UPLOAD",
  "UAE_MOHAP_REGISTERED_MEDICAL_PRODUCT_DIRECTORY",
  "UAE_MOHAP_OPEN_DATA_API_MARKETPLACE",
  "UAE_OFFICIAL_FILE_UPLOAD",
  "QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
  "KUWAIT_MOH_DRUG_PRICE_LIST",
  "KUWAIT_MOH_FOOD_SUPPLEMENT_PRICE_LIST",
  "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST",
  "BAHRAIN_NHRA_LICENSED_MEDICINES_OPEN_DATA",
  "OMAN_MOH_DRUG_SAFETY_CENTER",
  "OMAN_OFFICIAL_FILE_UPLOAD",
  "YEMEN_OFFICIAL_FILE_UPLOAD"
];

const checks = [];
function pass(message) {
  checks.push(message);
  console.log(`OFFICIAL-MEDS PASS ${message}`);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
  pass(message);
}

const sources = await prisma.drugMarketSource.findMany();
const sourceCodes = new Set(sources.map((source) => source.code));
for (const code of requiredSources) assert(sourceCodes.has(code), `source registry contains ${code}`);

const demoProducts = await prisma.drugMarketProduct.count({ where: { tradeName: { startsWith: "Demo" }, isDemo: true } });
assert(demoProducts >= 1, "seeded drug-market demo products are marked isDemo=true");
const realDemoLeak = await prisma.drugMarketVariant.count({ where: { isDemo: false, registrationNumber: { startsWith: "DEMO-" } } });
assert(realDemoLeak === 0, "demo variants are not counted as real rows");

const uae = sources.find((source) => source.code === "UAE_MOHAP_REGISTERED_MEDICAL_PRODUCT_DIRECTORY");
assert(uae?.coverageStatus === "blocked_requires_api_approval", "UAE MOHAP gated source records API approval requirement");
const egypt = sources.find((source) => source.code === "EDA_EGYPTIAN_DRUG_REGISTER");
assert(["partial", "not_imported", "needs_review"].includes(egypt?.coverageStatus ?? ""), "Egypt source is not marked complete from seed");
const oman = sources.find((source) => source.code === "OMAN_MOH_DRUG_SAFETY_CENTER");
assert(oman?.coverageStatus === "blocked_requires_official_file", "Oman remains official-file-required until import");

for (const script of [
  "scripts/official-medication-source-discovery.mjs",
  "scripts/import-official-medications.mjs",
  "scripts/validate-official-medication-data.mjs",
  "scripts/report-medication-source-coverage.mjs",
  "scripts/check-medication-source-freshness.mjs"
]) assert(existsSync(script), `${script} exists`);

const searchSource = readFileSync("apps/api/src/drug-market/drug-market-search.service.ts", "utf8");
assert(searchSource.includes("isDemo: showDemo ? undefined : false"), "drug-market search hides demo rows by default");
assert(!searchSource.toLowerCase().includes("checkout"), "drug-market search contains no checkout wording");

const docs = [
  "docs/OFFICIAL_MEDICATION_DATA_IMPORT_V0_8.md",
  "docs/OFFICIAL_MEDICATION_SOURCE_MAP.md",
  "docs/MEDICATION_REAL_DATA_VALIDATION.md"
];
for (const doc of docs) assert(existsSync(doc), `${doc} exists`);

console.log(`OFFICIAL-MEDS SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
await prisma.$disconnect();
