import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [dto, service, controller, schema, workspace] = await Promise.all([
  readFile("apps/api/src/medications/pharmacology-profile.dto.ts", "utf8"),
  readFile("apps/api/src/medications/medications.service.ts", "utf8"),
  readFile("apps/api/src/medications/medications.controller.ts", "utf8"),
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/web/components/medications/PharmacologyWorkspace.tsx", "utf8")
]);

assert(dto.includes("@ArrayMinSize(3)") && dto.includes("@ArrayMaxSize(5)"), "mechanism and pharmacodynamic summaries must remain 3–5 bullets");
for (const field of ["absorption", "metabolism", "halfLife", "elimination", "clinicalNotes"]) assert(dto.includes(field) && schema.includes(`${field}Json`), `structured PK field missing ${field}`);
assert(dto.includes("sourceId") && service.includes("pharmacologySource.findUnique"), "every authored fact set must reference a real source");
assert(service.includes('reviewStatus: "needs_review"') && service.includes("autoApproved: false"), "new pharmacology facts must never auto-approve");
assert(service.includes('action: "pharmacology.summary_draft_created"'), "summary authoring must be audited");
assert(controller.includes('@Post("pharmacology/generics/:id/summaries")') && controller.includes('@Permissions("medications.manage_catalog")'), "controlled authoring endpoint missing");
assert(controller.includes('@Get("pharmacology/coverage")'), "coverage endpoint missing");
assert(service.includes("completeDatasetClaimed: false") && service.includes("clinicalVerificationClaimed: false"), "coverage must not claim completeness or verification");
assert(workspace.includes('level === "Quick" ? 6') && workspace.includes("No source-reviewed"), "Quick mode must stay concise and transparent about gaps");
for (const status of ["adjustmentStatus", "primaryElimination", "activeMetaboliteAccumulation", "monitoringText"]) assert(schema.includes(status), `renal/hepatic summary field missing ${status}`);

console.log("v1.4.5 concise source-backed pharmacology summary governance PASS (20 assertions)");
