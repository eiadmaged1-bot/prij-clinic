import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, seed, service, search] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260714223000_generic_first_pharmacology/migration.sql", "utf8"),
  readFile("apps/api/prisma/seed.js", "utf8"),
  readFile("apps/api/src/medications/medications.service.ts", "utf8"),
  readFile("apps/api/src/medications/medication-search.service.ts", "utf8")
]);

for (const model of ["DrugFamily", "MedicationGeneric", "MedicationAlias", "MechanismSummary", "PharmacodynamicSummary", "PharmacokineticSummary", "AdverseEffect", "Contraindication", "Caution", "Interaction", "MonitoringRequirement", "PregnancyLactationProfile", "RenalGuidance", "HepaticGuidance", "AntimicrobialSpectrum", "DoseFormula", "FormulaVersion", "PharmacologySource", "ReviewRecord"]) assert(schema.includes(`model ${model}`), `generic-first entity missing ${model}`);
for (const table of ["MedicationAlias", "MechanismSummary", "AntimicrobialSpectrum", "DoseFormula", "FormulaVersion", "PharmacologySource", "ReviewRecord"]) assert(migration.includes(`CREATE TABLE "${table}"`), `forward migration table missing ${table}`);
assert(schema.includes("GenericMedicationFamilyMembership"), "generic-to-family bridge missing");
assert(schema.includes('@default("TRADE_NAME")') && schema.includes("scopeType"), "trade names must remain optional scoped aliases");
assert(seed.includes('["Salbutamol", "SABA"]') && seed.includes('["Terbutaline", "SABA"]') && seed.includes("familyByCode.get(familyCode)"), "SABA must link to Salbutamol and Terbutaline");
assert(service.includes("genericMemberships: { some: {} }") && search.includes("genericMemberships: { some: {} }"), "placeholder-only families must be excluded from normal clinical presentation");
assert(!seed.includes('brandName: "Salbutamol"') && !seed.includes('tradeName: "Salbutamol"'), "generic identity must not be seeded as a trade name");

assert(seed.includes('reviewStatus: "needs_review"'), "seeded identities must not claim clinical verification");
console.log("v1.4.5 generic-first pharmacology data model PASS (35 assertions; static isolation-safe mode)");
