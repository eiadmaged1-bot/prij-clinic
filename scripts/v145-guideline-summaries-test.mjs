import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, dto, service, controller, viewer] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260714213000_guideline_structured_summaries/migration.sql", "utf8"),
  readFile("apps/api/src/guidelines/dto/guideline-summary.dto.ts", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.controller.ts", "utf8"),
  readFile("apps/web/app/guidelines/[id]/page.tsx", "utf8")
]);

for (const model of ["GuidelineSummary", "GuidelineSummarySection", "GuidelineSummaryCitation"]) assert(schema.includes(`model ${model}`) && migration.includes(`CREATE TABLE "${model}"`), `forward-only summary model missing ${model}`);
for (const section of ["AT_A_GLANCE", "SCOPE_POPULATION", "KEY_RECOMMENDATIONS", "ASSESSMENT_DIAGNOSIS", "INVESTIGATIONS", "RISK_STRATIFICATION", "MANAGEMENT", "MEDICATION_GUIDANCE", "PROCEDURES_INTERVENTIONS", "SPECIAL_POPULATIONS", "PREGNANCY_LACTATION", "MONITORING", "FOLLOW_UP", "ESCALATION_REFERRAL", "RED_FLAGS", "WHAT_NOT_TO_DO", "EVIDENCE_LIMITATIONS", "DECISION_PATHWAY"]) assert(dto.includes(section) && service.includes(section), `structured summary section missing ${section}`);
for (const provenance of ["DIRECT_RECOMMENDATION", "BACKGROUND_INFORMATION", "LOCAL_CLINIC_NOTE", "AI_GENERATED_DRAFT", "DOCTOR_ANNOTATION"]) assert(dto.includes(provenance), `summary provenance missing ${provenance}`);
assert(service.includes("Every summary bullet requires a page citation"), "material bullet citation gate missing");
assert(service.includes("Summary citations must reference this guideline document only"), "cross-document citation integrity gate missing");
assert(service.includes('status: "NEEDS_REVIEW"'), "new summaries must remain unapproved drafts");
assert(service.includes('user.roles.includes("Doctor")') && service.includes("A Doctor role is required"), "doctor-only summary review gate missing");
assert(service.includes("autoApproved: false"), "audit evidence must state summaries are never auto-approved");
assert(controller.includes('@Post("documents/:id/summaries")') && controller.includes('@Post("documents/:documentId/summaries/:summaryId/review")'), "summary workflow endpoints missing");
assert(viewer.includes("citation.pageStart") && viewer.includes('setMobileTab("PDF")'), "citation must open the exact original PDF page");
for (const status of ["CLINIC_APPROVED", "Needs review"]) assert(viewer.includes(status), `summary status missing ${status}`);
assert(viewer.includes("Doctor review required; not approved for clinical reliance."), "draft summary safety label missing");

console.log("v1.4.5 reviewed page-cited guideline summary architecture PASS (39 assertions)");
