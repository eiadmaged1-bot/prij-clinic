import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { investigationCatalogItems, seedInvestigationCatalog } = require("../apps/api/prisma/seeds/investigation-catalog.js");

const allowedCategories = new Set([
  "Laboratory",
  "Imaging",
  "Pathology",
  "Cardiac and Functional Tests",
  "Procedures and Referrals",
  "Other"
]);

assert.ok(Array.isArray(investigationCatalogItems), "Investigation catalogue must export an array.");
assert.ok(investigationCatalogItems.length >= 200, `Expected at least 200 catalogue items, found ${investigationCatalogItems.length}.`);

const byCode = new Map();
const normalizedNames = new Map();
for (const item of investigationCatalogItems) {
  assert.ok(item.code && typeof item.code === "string", "Every investigation requires a code.");
  assert.ok(item.name && typeof item.name === "string", `${item.code} requires a name.`);
  assert.ok(allowedCategories.has(item.category), `${item.code} uses a noncanonical category: ${item.category}`);
  assert.ok(item.subcategory && typeof item.subcategory === "string", `${item.code} requires a subcategory.`);
  assert.ok(!byCode.has(item.code), `Duplicate investigation code: ${item.code}`);
  byCode.set(item.code, item);

  const normalizedName = normalize(item.name);
  assert.ok(!normalizedNames.has(normalizedName), `Duplicate investigation name: ${item.name}`);
  normalizedNames.set(normalizedName, item.code);
}

const required = {
  CBC: ["Laboratory", "Hematology"],
  COAGULATION_PROFILE: ["Laboratory", "Coagulation"],
  THROMBIN_TIME: ["Laboratory", "Coagulation"],
  VON_WILLEBRAND_PANEL: ["Laboratory", "Coagulation"],
  URINALYSIS: ["Laboratory", "Urine Analysis"],
  URINE_CULTURE: ["Laboratory", "Microbiology"],
  HIGH_VAGINAL_SWAB_MICROSCOPY: ["Laboratory", "Microbiology"],
  SEMEN_ANALYSIS: ["Laboratory", "Andrology"],
  SPERM_DNA_FRAGMENTATION: ["Laboratory", "Andrology"],
  BRCA1_BRCA2_TEST: ["Laboratory", "Genetics and Prenatal Screening"],
  PGT_A: ["Laboratory", "Genetics and Prenatal Screening"],
  OBSTETRIC_DOPPLER: ["Imaging", "Obstetric Doppler"],
  UMBILICAL_ARTERY_DOPPLER: ["Imaging", "Obstetric Doppler"],
  MCA_DOPPLER: ["Imaging", "Obstetric Doppler"],
  LOWER_LIMB_VENOUS_DUPLEX_BILATERAL: ["Imaging", "Vascular Ultrasound"],
  LOWER_LIMB_ARTERIAL_DUPLEX: ["Imaging", "Vascular Ultrasound"],
  ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY: ["Pathology", "Histopathology"],
  CTG: ["Cardiac and Functional Tests", "Fetal Surveillance"],
  ANESTHESIA_ASSESSMENT: ["Procedures and Referrals", "Preoperative Assessment"]
};

for (const [code, [category, subcategory]] of Object.entries(required)) {
  const item = byCode.get(code);
  assert.ok(item, `Required investigation is missing: ${code}`);
  assert.equal(item.category, category, `${code} is in the wrong category.`);
  assert.equal(item.subcategory, subcategory, `${code} is in the wrong subcategory.`);
}

assert.equal(byCode.get("OGTT_75G")?.subcategory, "Clinical Chemistry", "OGTT must not be classified as genetics.");
assert.ok(byCode.get("LOWER_LIMB_VENOUS_DUPLEX_BILATERAL")?.aliases.some((value) => /doppler/i.test(value)), "Lower-limb duplex needs a Doppler search alias.");
assert.ok(byCode.get("URINALYSIS")?.aliases.some((value) => value.includes("تحليل بول")), "Urinalysis needs an Arabic search alias.");

const upserts = [];
await seedInvestigationCatalog({
  investigationCatalogItem: {
    async upsert(input) {
      upserts.push(input);
      return { id: input.where.code, ...input.create };
    },
    async findMany() {
      return [];
    },
    async update() {
      throw new Error("Taxonomy update should not run when the mock returns no active records.");
    }
  }
});

assert.equal(upserts.length, investigationCatalogItems.length, "Every reference investigation must be upserted exactly once.");
for (const operation of upserts) {
  assert.equal(operation.create.active, true, `${operation.where.code} must be active when first created.`);
  assert.ok(!Object.prototype.hasOwnProperty.call(operation.update, "active"), `${operation.where.code} reseeding must preserve an archived active=false state.`);
}

const categoryCounts = investigationCatalogItems.reduce((counts, item) => {
  counts[item.category] = (counts[item.category] ?? 0) + 1;
  return counts;
}, {});

console.log("Investigation catalogue quality checks passed.");
console.log("Investigation catalogue reseeding preserves Doctor/Owner archive choices.");
console.log(JSON.stringify({ total: investigationCatalogItems.length, categoryCounts }, null, 2));

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
}
