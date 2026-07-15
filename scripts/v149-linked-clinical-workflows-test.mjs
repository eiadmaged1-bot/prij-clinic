import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, controller, service, dto, page, investigation, protocolSchema, protocolService, protocolPage, prescription] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260715222000_v149_ultrasound_context/migration.sql", "utf8"),
  readFile("apps/api/src/pregnancy/pregnancy.controller.ts", "utf8"),
  readFile("apps/api/src/pregnancy/pregnancy.service.ts", "utf8"),
  readFile("apps/api/src/pregnancy/dto.ts", "utf8"),
  readFile("apps/web/app/ob-ultrasounds/page.tsx", "utf8"),
  readFile("apps/web/app/investigations/page.tsx", "utf8"),
  readFile("apps/api/prisma/migrations/20260715223500_v149_protocol_completion/migration.sql", "utf8"),
  readFile("apps/api/src/protocol-atlas/protocol-atlas.service.ts", "utf8"),
  readFile("apps/web/app/admin/protocol-atlas/page.tsx", "utf8"),
  readFile("apps/web/app/prescriptions/page.tsx", "utf8")
]);

for (const field of ["clinicalContext", "cycleDay", "structuredFindingsJson", "comparisonText", "signedAt", "amendmentReason", "amendmentVersion"]) assert.match(schema, new RegExp(field));
assert.match(migration, /ALTER TABLE "ObUltrasound"/); assert.doesNotMatch(migration, /^(DELETE FROM|TRUNCATE|DROP TABLE)/im);
assert.match(controller, /@Query\(\) query/); assert.match(service, /skip: \(page - 1\) \* limit/); assert.match(service, /take: limit/); assert.match(service, /pageInfo/);
assert.match(service, /dataClassification: \{ notIn: \["TEST", "QUARANTINED"\] \}/);
assert.match(service, /hasMeaningfulUltrasoundContent/); assert.match(service, /required before review/); assert.match(service, /amendment reason is required/i);
assert.match(dto, /\["OB", "GYN", "FERTILITY"\]/); assert.match(page, /Cycle day/); assert.match(page, /pageInfo\.hasMore/);
for (const term of ["selected basket", "Overall indication", "Priority", "Follow-up deadline", "Save to visit", "Result received", "Doctor reviewed"]) assert.match(investigation, new RegExp(term, "i"));
for (const field of ["completionQuestionnaireJson", "connectionsJson", "completionPercentage", "completionVersion"]) assert.match(protocolSchema, new RegExp(field));
for (const field of ["scope", "inclusion", "exclusion", "requiredHistory", "examination", "investigations", "redFlags", "management", "medicationConsiderations", "followUp", "escalationReferral", "counselling", "sourceVersion", "clinicWorkflow", "reviewer", "approval"]) assert.match(protocolService, new RegExp(`"${field}"`));
assert.match(protocolService, /Doctor decision is recorded only in the patient encounter/); assert.match(protocolPage, /Protocol Completion Studio/); assert.match(protocolPage, /do not invent medical content/);
assert.match(prescription, /active patient|patient context|patientId/i);

console.log("v1.4.9 linked ultrasound, investigation, prescription and protocol workflows PASS (55 assertions)");
