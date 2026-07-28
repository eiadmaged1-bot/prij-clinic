import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  investigationCatalogItems,
  REQUIRED_CATALOG_CODES,
  seedInvestigationCatalog
} = require("../apps/api/prisma/seeds/investigation-catalog.js");

const allowedCategories = new Set([
  "Laboratory",
  "Imaging",
  "Cardiac and Functional Testing",
  "Pathology and Molecular Diagnostics",
  "Diagnostic Procedures",
  "Specialist Referrals and Clearance"
]);

assert.ok(Array.isArray(investigationCatalogItems), "Investigation catalogue must export an array.");
assert.ok(Object.isFrozen(investigationCatalogItems), "Exported investigation catalogue must be read-only.");
assert.ok(investigationCatalogItems.length >= 200, `Expected at least 200 catalogue items, found ${investigationCatalogItems.length}.`);
assert.ok(Array.isArray(REQUIRED_CATALOG_CODES), "Required investigation codes must be exported.");
assert.ok(Object.isFrozen(REQUIRED_CATALOG_CODES), "Required investigation codes must be read-only.");

const byCode = new Map();
const normalizedNames = new Map();
for (const item of investigationCatalogItems) {
  assert.ok(Object.isFrozen(item), `${item.code ?? "Unknown investigation"} must be read-only.`);
  assert.ok(item.code && typeof item.code === "string", "Every investigation requires a code.");
  assert.ok(item.name && typeof item.name === "string", `${item.code} requires a name.`);
  assert.ok(allowedCategories.has(item.category), `${item.code} uses a noncanonical category: ${item.category}`);
  assert.ok(item.subcategory && typeof item.subcategory === "string", `${item.code} requires a subcategory.`);
  assert.ok(Array.isArray(item.aliases), `${item.code} requires a stable aliases array.`);
  assert.ok(Object.isFrozen(item.aliases), `${item.code} aliases must be read-only.`);
  assert.ok(!byCode.has(item.code), `Duplicate investigation code: ${item.code}`);
  byCode.set(item.code, item);

  const normalizedName = normalize(item.name);
  assert.ok(!normalizedNames.has(normalizedName), `Duplicate investigation name: ${item.name}`);
  normalizedNames.set(normalizedName, item.code);
}

for (const code of REQUIRED_CATALOG_CODES) {
  assert.ok(byCode.has(code), `Required investigation is missing: ${code}`);
}

const requiredTaxonomy = {
  COMPLETE_BLOOD_COUNT_CBC: ["Laboratory", "Hematology and Immunohematology"],
  COAGULATION_PROFILE: ["Laboratory", "Coagulation and Thrombophilia"],
  ROUTINE_URINE_ANALYSIS: ["Laboratory", "Urine and Stool Analysis"],
  URINE_CULTURE_AND_SENSITIVITY: ["Laboratory", "Microbiology"],
  SEMEN_ANALYSIS: ["Laboratory", "Andrology"],
  NON_INVASIVE_PRENATAL_TESTING_NIPT: ["Laboratory", "Genetics and Prenatal Screening"],
  OBSTETRIC_DOPPLER_ULTRASOUND: ["Imaging", "Obstetric Doppler"],
  LOWER_LIMB_VENOUS_DUPLEX_DVT_SCAN: ["Imaging", "Duplex and Vascular Doppler"],
  PELVIC_MRI: ["Imaging", "MRI"],
  ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY: ["Pathology and Molecular Diagnostics", "Histopathology"],
  CARDIOTOCOGRAPHY_NON_STRESS_TEST_CTG_NST: ["Cardiac and Functional Testing", "Cardiac Testing"],
  COLPOSCOPY: ["Diagnostic Procedures", "Gynecologic Diagnostic Procedures"],
  ANESTHESIA_ASSESSMENT: ["Specialist Referrals and Clearance", "Preoperative Assessment and Clearance"]
};

for (const [code, [category, subcategory]] of Object.entries(requiredTaxonomy)) {
  const item = byCode.get(code);
  assert.ok(item, `Taxonomy sentinel is missing: ${code}`);
  assert.equal(item.category, category, `${code} is in the wrong category.`);
  assert.equal(item.subcategory, subcategory, `${code} is in the wrong subcategory.`);
}

assert.ok(
  byCode.get("COMPLETE_BLOOD_COUNT_CBC")?.aliases.some((value) => value.includes("صورة دم كاملة")),
  "Complete blood count needs its Arabic search alias."
);
assert.ok(
  byCode.get("PELVIC_MRI")?.aliases.some((value) => /mri pelvis/i.test(value)),
  "Pelvic MRI needs its established search alias."
);

const upserts = [];
const archived = [];
const favoriteDeletes = [];
const favoriteUpdates = [];
const reusableListDeletes = [];
const reusableListUpdates = [];

await seedInvestigationCatalog({
  investigationCatalogItem: {
    async upsert(input) {
      upserts.push(input);
      return { id: `canonical:${input.where.code}`, ...input.create };
    },
    async findMany() {
      return [
        { id: "legacy-cbc", code: "LEGACY_CBC", name: "Complete Blood Picture", active: true },
        { id: "legacy-mri", code: "LEGACY_PELVIC_MRI", name: "MRI pelvis", active: true }
      ];
    },
    async update(input) {
      archived.push(input);
      return input;
    }
  },
  investigationFavorite: {
    async findMany() {
      return [
        { id: "favorite-duplicate", userId: "doctor-1", investigationCatalogItemId: "legacy-cbc" },
        { id: "favorite-update", userId: "doctor-2", investigationCatalogItemId: "legacy-mri" }
      ];
    },
    async findUnique({ where }) {
      return where.userId_investigationCatalogItemId.userId === "doctor-1" ? { id: "existing-favorite" } : null;
    },
    async delete(input) {
      favoriteDeletes.push(input);
    },
    async update(input) {
      favoriteUpdates.push(input);
    }
  },
  investigationFavoriteSetItem: {
    async findMany() {
      return [
        { id: "list-duplicate", favoriteSetId: "set-1", investigationCatalogItemId: "legacy-cbc" },
        { id: "list-update", favoriteSetId: "set-2", investigationCatalogItemId: "legacy-mri" }
      ];
    },
    async findUnique({ where }) {
      return where.favoriteSetId_investigationCatalogItemId.favoriteSetId === "set-1" ? { id: "existing-list-item" } : null;
    },
    async delete(input) {
      reusableListDeletes.push(input);
    },
    async update(input) {
      reusableListUpdates.push(input);
    }
  }
});

assert.equal(upserts.length, investigationCatalogItems.length, "Every reference investigation must be upserted exactly once.");
for (const operation of upserts) {
  assert.equal(operation.create.active, true, `${operation.where.code} must be active when first created.`);
  assert.ok(!Object.prototype.hasOwnProperty.call(operation.update, "active"), `${operation.where.code} reseeding must preserve an archived active=false state.`);
}

assert.equal(archived.length, 2, "Mapped legacy catalogue records must be archived.");
for (const operation of archived) {
  assert.deepEqual(operation.data, { active: false }, "Legacy archive updates must only deactivate the legacy record.");
}
assert.deepEqual(favoriteDeletes, [{ where: { id: "favorite-duplicate" } }], "Duplicate favorites must be removed during remapping.");
assert.deepEqual(
  favoriteUpdates,
  [{ where: { id: "favorite-update" }, data: { investigationCatalogItemId: "canonical:PELVIC_MRI" } }],
  "Unique favorites must be remapped to the canonical item."
);
assert.deepEqual(reusableListDeletes, [{ where: { id: "list-duplicate" } }], "Duplicate reusable-list items must be removed during remapping.");
assert.deepEqual(
  reusableListUpdates,
  [{ where: { id: "list-update" }, data: { investigationCatalogItemId: "canonical:PELVIC_MRI" } }],
  "Unique reusable-list items must be remapped to the canonical item."
);

const categoryCounts = investigationCatalogItems.reduce((counts, item) => {
  counts[item.category] = (counts[item.category] ?? 0) + 1;
  return counts;
}, {});

console.log("Investigation catalogue quality checks passed.");
console.log("Investigation catalogue reseeding preserves Doctor/Owner archive choices.");
console.log("Favorite and reusable-list mappings remain canonical.");
console.log(JSON.stringify({ total: investigationCatalogItems.length, categoryCounts }, null, 2));

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
}
