import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const [visit, overview, encounter, doctorVisit, medicationSearch, medicationCenter, medicationComponents, importer] = await Promise.all([
  readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/patient-components.tsx", "utf8"),
  readFile("apps/api/src/encounters/encounters.service.ts", "utf8"),
  readFile("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8"),
  readFile("apps/api/src/medications/medication-search.service.ts", "utf8"),
  readFile("apps/web/app/medications/page.tsx", "utf8"),
  readFile("apps/web/components/medications/MedicationComponents.tsx", "utf8"),
  readFile("scripts/sync-egyptian-drug-database.mjs", "utf8")
]);

for (const contract of ["Smart complaint tags", "Structured History", "examinationJson", "selected-clinical-basket"]) assert.match(visit, new RegExp(contract));
for (const context of ["pregnancy", "gynecology", "infertility", "postpartum"]) assert.match(visit, new RegExp(context));
for (const exclusive of ["pallor", "cervical os", "uterine size"]) assert.match(visit, new RegExp(exclusive));
assert.match(visit, /Obstetric Ultrasound/);
assert.match(visit, /Fertility Ultrasound \/ Folliculometry/);
assert.match(visit, /clinical-category-grid/);
assert.match(visit, /Selected findings/);
assert.doesNotMatch(visit, /Clinical documentation workspace · Doctor approval required/);
assert.match(visit, /localStorage\.removeItem\(draftKey\)[\s\S]*completeDoctorVisit|completeDoctorVisit[\s\S]*localStorage\.removeItem\(draftKey\)/);
assert.match(overview, /structuredEncounterInput/);
assert.match(overview, /complaintById/);
for (const contract of ["ContextClinicalCalendar", "MenstrualHistoryTimeline", "reproductiveSnapshot", "sourceEncounterId", ">Previous<", ">Next<"]) assert.match(overview, new RegExp(contract));
assert.match(overview, /Obstetric Ultrasound/);
assert.match(overview, /Record postpartum ultrasound/);
assert.match(encounter, /existing\.status === "signed"/);
assert.match(encounter, /PregnancyDatingAssessment|pregnancyDatingAssessment/);
assert.match(doctorVisit, /examinationJson[\s\S]*stampStructuredInput/);
for (const tab of ["Search &amp; Reference", "Templates", "Saved Medications"]) assert.match(medicationCenter, new RegExp(tab));
assert.match(medicationCenter, /MedicationSearchBox/);
for (const contract of ["SOURCE_MARKET", "mapping_under_review", "rankResult", "tradeNameArabic", "linkedGenericId"]) assert.match(medicationSearch, new RegExp(contract));
for (const contract of ["EXPECTED_ROWS = 25094", "EXPECTED_SHA256", "aliasesQuarantined", "projectedNewVariants", "CLEAN_MISSING_GENERIC_ALLOWLIST"]) assert.match(importer, new RegExp(contract));
const patientWorkspace = medicationComponents.slice(medicationComponents.indexOf("export function PatientMedicationWorkspace"), medicationComponents.indexOf("export function CountryBadge"));
assert.doesNotMatch(patientWorkspace, /DrugMarketSearchBox/);
assert.match(patientWorkspace, /Open Prescription Builder/);

const prisma = new PrismaClient();
try {
  assert.equal(await prisma.medicationGeneric.count(), 775);
  assert.equal(await prisma.drugMarketProduct.count(), 18078);
  assert.equal(await prisma.drugMarketVariant.count(), 22770);
  assert.equal(await prisma.drugMarketManualReviewQueue.count(), 13818);
  assert.equal(await prisma.prescription.count(), 195);
} finally {
  await prisma.$disconnect();
}
console.log("Clinical workflow unification and medication-count guard PASS");
