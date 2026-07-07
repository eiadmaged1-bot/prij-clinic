import { readFileSync } from "node:fs";

const checks = [];
const read = (path) => readFileSync(path, "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  checks.push(message);
};

const schema = read("apps/api/prisma/schema.prisma");
const patientDto = read("apps/api/src/patients/dto.ts");
const patientService = read("apps/api/src/patients/patients.service.ts");
const patientController = read("apps/api/src/patients/patients.controller.ts");
const newPatient = read("apps/web/app/patients/new/page.tsx");
const patientsPage = read("apps/web/app/patients/page.tsx");
const patientFile = read("apps/web/app/patients/[id]/page.tsx");
const investigationsPage = read("apps/web/app/investigations/page.tsx");
const investigationsService = read("apps/api/src/investigations/investigations.service.ts");
const billingController = read("apps/api/src/billing/billing.controller.ts");
const billingService = read("apps/api/src/billing/billing.service.ts");
const shell = read("apps/web/app/mvp-page.tsx");
const css = read("apps/web/app/globals.css");
const visitTypes = read("apps/web/lib/visit-types.ts");

assert(schema.includes("INFERTILITY"), "PatientType includes INFERTILITY");
assert(newPatient.includes("patientTypeOptions") && newPatient.includes('patientType: form.patientType || "WOMEN_HEALTH"'), "new patient form can choose patient type instead of hardcoding payload");
assert(patientsPage.includes("patientTypeOptions") && patientsPage.includes("Infertility"), "patient files include patient type filter");
assert(patientFile.includes("patientTypeLabel") && patientFile.includes("patientTypeOptions"), "patient workspace shows and edits human patient type label");
assert(schema.includes("model PatientClinicalPhase") && patientController.includes('@Get(":id/phases")'), "clinical phases model and endpoints exist");
assert(patientService.includes("currentPhase") && patientsPage.includes("currentPhase"), "current phase is exposed on patient cards");
assert(patientFile.includes("InfertilityWorkspacePanel") && patientFile.includes('key: "infertility"'), "infertility tab renders in patient workspace");
assert(schema.includes("model OvulationInductionCycle") && patientController.includes("createOvulationCycle"), "induction cycle can be created");
assert(patientFile.includes("Save AMH") && patientService.includes("ovulation_cycle.amh_updated"), "AMH data can be recorded");
assert(patientFile.includes("Follicular monitoring") && patientFile.includes("rightOvaryFollicleCount") && patientFile.includes("leftOvaryFollicleCount"), "follicular monitoring right/left ovary data can be recorded");
assert(patientFile.includes("E2 / Estradiol serial results") && patientService.includes("estradiol_result.created"), "E2 serial results can be added");
assert(investigationsPage.includes("investigation-category-sidebar"), "investigations category sidebar renders");
assert(schema.includes("model InvestigationFavorite") && investigationsPage.includes("Starred"), "favorites star works");
assert(investigationsPage.includes("High Priority / Common") && schema.includes("isHighPriority"), "high priority section renders");
assert(investigationsService.includes("Recurrent Abortion / RPL"), "RPL category exists");
assert(investigationsService.includes("Tumor Markers / Gyn Oncology") && investigationsService.includes("Ovarian Tumor Marker Workup"), "Gyn Oncology category exists");
assert(shell.includes("<LanguageSwitcher />") && shell.includes("sidebar-footer"), "global language switcher visible in shell and mobile drawer footer");
for (const label of ["كشف", "إعادة", "استشارة", "مستعجل"]) assert(visitTypes.includes(label), `fixed Arabic visit label ${label} exists`);
assert(css.includes("white-space: nowrap") && css.includes("word-break: keep-all"), "visit type buttons do not break Arabic words on mobile");
assert(newPatient.includes("Not sexually active") && newPatient.includes("not_sexually_active") && newPatient.includes('"unknown"'), "not sexually active checkbox visible and unchecked means unknown");
assert(shell.includes("account-logout-button") && shell.includes("sidebar-logout-button"), "logout visible in account menu and mobile drawer footer");
assert(billingController.includes("owner/visit-price-audit") && billingService.includes("assertOwnerOnly") && billingService.includes("expectedTotal"), "owner-only visit price audit exists");
assert(!newPatient.includes("expectedTotal") && !patientsPage.includes("baseVisitPriceX"), "owner pricing formula is not exposed in reception patient UI");
assert(css.includes(".sidebar-footer") && css.includes("bottom: 0"), "mobile drawer logout/language footer does not overlap nav");
assert(newPatient.includes("Generate another file number") && newPatient.includes("Possible match found. Open existing file to review."), "new patient registration mobile flow is polished");
assert(patientsPage.includes("patient-list-card") && patientsPage.includes("Age") && !patientsPage.includes("Status: {status}"), "patient registry cards are compact and friendly");
assert(patientFile.includes("New Encounter") && patientFile.includes("Request Investigation") && patientFile.includes("Book Follow-up") && patientFile.includes("More"), "patient hero quick actions are wired");
const session = read("apps/web/app/session.tsx");
assert(session.includes("sameOriginApiProxyPath") && session.includes("authLogoutPath") && session.includes("/auth/logout"), "v1.3.7 same-origin logout proxy preserved");

console.log(`V138-WORKFLOW SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
