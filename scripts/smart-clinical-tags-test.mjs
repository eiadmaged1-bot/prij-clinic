import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPrisma } from "./v121-reference-utils.mjs";

const [schema, migration, seed, controller, service, patientUi, searchUi] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260713210000_smart_clinical_tag_history/migration.sql", "utf8"),
  readFile("apps/api/prisma/seed.js", "utf8"),
  readFile("apps/api/src/clinical-tags/clinical-tags.controller.ts", "utf8"),
  readFile("apps/api/src/clinical-tags/clinical-tags.service.ts", "utf8"),
  readFile("apps/web/app/patients/[id]/patient-components.tsx", "utf8"),
  readFile("apps/web/app/clinical-tags/page.tsx", "utf8")
]);

for (const field of ["historyStatus", "tagYear", "detailJson", "manualNote", "clinicalGroupSnapshot", "indication", "startDate", "stopDate"]) {
  assert(schema.includes(field) && migration.includes(`\"${field}\"`), `forward-only schema field missing: ${field}`);
}
for (const tag of ["AUB", "Heavy menstrual bleeding", "Intermenstrual bleeding", "Postcoital bleeding", "Postmenopausal bleeding", "PCOS", "Fibroid", "Hysterectomy", "Salpingectomy", "Oophorectomy", "Endometrial ablation", "IVF/ICSI procedure"]) {
  assert(seed.includes(`\"${tag}\"`), `required clinical tag seed missing: ${tag}`);
}
assert(controller.includes('@Post("patients/:id/clinical-tags")') && controller.includes('@Patch("patients/:patientId/clinical-tags/:tagId")') && controller.includes('@Delete("patients/:patientId/clinical-tags/:tagId")'), "tag assignment, edit, and remove endpoints must exist");
assert(service.includes("terms.every") && service.includes("splitTerms") && service.includes("matchingTags"), "multi-tag AND search must be implemented");
assert(service.includes("medicationSearchText") && service.includes("className") && service.includes("clinicalGroupSnapshot"), "generic, family, class, and clinical-group medication search must be implemented");
assert(service.includes('action: "clinical_tags.patient_search"') && service.includes('action: "clinical_tag.updated"') && service.includes('action: "clinical_tag.removed"'), "clinical search and changes must be audited");
assert(patientUi.includes("history-category-list") && patientUi.includes("activeGroup") && patientUi.includes("Add custom tag") && patientUi.includes("Manual note"), "history must be mouse-first and show one editable category at a time");
assert(searchUi.includes("PCOS + metformin") && searchUi.includes("matchingMedications") && searchUi.includes("Last visit"), "Smart Clinical Search must expose multi-tag and medication matches");

const prisma = createPrisma();
try {
  const requiredCodes = ["aub", "pcos", "hysterectomy", "salpingectomy", "oophorectomy", "ivf_icsi_procedure"];
  const present = await prisma.clinicalTagDefinition.count({ where: { code: { in: requiredCodes }, active: true } });
  assert.equal(present, requiredCodes.length, "seeded smart tag definitions must be present in the local reference database");
} finally {
  await prisma.$disconnect();
}

console.log("Smart clinical tags, operation search, medication-class search, and multi-tag search PASS");
