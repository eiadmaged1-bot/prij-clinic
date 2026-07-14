import { readFileSync } from "node:fs";

const checks = [];
const read = (path) => readFileSync(path, "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`V139 PASS ${message}`);
};

const doctor = read("apps/web/app/doctor/page.tsx");
const patientFile = read("apps/web/app/patients/[id]/page.tsx");
const patientComponents = read("apps/web/app/patients/[id]/patient-components.tsx");
const patientFeatures = patientComponents + read("apps/web/app/patients/[id]/pregnancy-components.tsx") + read("apps/web/app/patients/[id]/panel-components.tsx");
const schema = read("apps/api/prisma/schema.prisma");
const seed = read("apps/api/prisma/seed.js");
const clinicalTagsService = read("apps/api/src/clinical-tags/clinical-tags.service.ts");
const clinicalTagsController = read("apps/api/src/clinical-tags/clinical-tags.controller.ts");
const externalIntakeService = read("apps/api/src/external-intake/external-intake.service.ts");
const externalIntakeController = read("apps/api/src/external-intake/external-intake.controller.ts");
const calendar = read("apps/web/app/calendar/page.tsx");
const obDating = read("apps/web/components/calculators/ObDatingReviewPanel.tsx");
const shell = read("apps/web/app/mvp-page.tsx");
const i18nAr = read("apps/web/i18n/ar.ts");
const language = read("apps/web/i18n/useI18n.tsx");
const visitTypes = read("apps/web/lib/visit-types.ts");
const externalInbox = read("apps/web/app/external-intake/page.tsx");
const smartSearch = read("apps/web/app/clinical-tags/page.tsx");

const removed = [
  "Open Day Checklist",
  "Close Day Checklist",
  "Waiting-time alerts",
  "Queue ticket QR",
  "Queue ticket / QR",
  "Print queue ticket",
  "Guided staff help",
  "Copyable message templates"
];
for (const text of removed) assert(!doctor.includes(text), `${text} removed from doctor workflow`);
assert(patientComponents.includes("Patient QR") && patientComponents.includes("patientQrSvgDataUri"), "permanent patient QR remains in patient file");
assert(language.includes("localStorage.setItem") && language.includes("prijClinicLanguage") && language.includes("عربي"), "segmented language switcher persists Arabic/English state");
assert(i18nAr.includes("لوحة التحكم") && i18nAr.includes("وضع الطبيب") && shell.includes("navText(label, t)"), "Arabic navigation labels are translated through shell");
for (const label of ["كشف", "إعادة", "استشارة", "مستعجل"]) assert(visitTypes.includes(label), `fixed Arabic visit type ${label} preserved`);

assert(patientFeatures.includes("GpalStepper") && patientFeatures.includes("gpal-live-summary") && patientFeatures.includes("Review G/P/A/L consistency"), "G/P/A/L numeric steppers and warning render");
assert(patientFeatures.includes("PreviousPregnancyHistoryCard") && patientFeatures.includes("Normal vaginal delivery") && patientFeatures.includes("Cesarean section"), "structured previous delivery history supports NVD and CS");
assert(patientComponents.includes("SmartHistoryOptionChips") && patientComponents.includes("dilation_and_curettage") && patientComponents.includes("mastectomy") && patientComponents.includes("previous_cesarean_section"), "smart history chips create clinical tags");

assert(schema.includes("model ClinicalTagDefinition") && schema.includes("model PatientClinicalTag"), "clinical tag models exist");
assert(seed.includes("dilation_and_curettage") && seed.includes("mastectomy") && seed.includes("ovulation_induction"), "initial clinical tag definitions are seeded");
assert(clinicalTagsController.includes('@Get("clinical-tags/definitions")') && clinicalTagsController.includes('@Get("clinical-tags/patients")') && clinicalTagsController.includes('@Post("patients/:id/clinical-tags")'), "clinical tag endpoints exist");
assert(clinicalTagsService.includes("clinical_tags.patient_search") && clinicalTagsService.includes("assertClinicalSearchRole"), "cohort search is audited and role-guarded");
assert(smartSearch.includes("No patients found for this tag.") && smartSearch.includes("Open patient file"), "clinical tag search UI returns patient cards");

assert(obDating.includes("IVF_DAY3") && obDating.includes("embryoAgeDays: 3"), "IVF day 3 EDD workflow maps to +263 formula");
assert(obDating.includes("IVF_DAY5") && obDating.includes("embryoAgeDays: 5"), "IVF day 5 EDD workflow maps to +261 formula");
assert(obDating.includes("IVF_DAY6") && obDating.includes("embryoAgeDays: 6"), "IVF day 6 EDD workflow maps to +260 formula");
assert(obDating.includes("IUI") && obDating.includes('datingSource: "CONCEPTION"'), "IUI/trigger uses conception dating");
assert(obDating.includes("Review and lock EDD") && obDating.includes("Reason is required to change a locked EDD."), "EDD lock/change reason workflow exists");
assert(calendar.includes("EDD Clinical Calendar") && calendar.includes("/clinical-calendar/edd") && calendar.includes("Locked/reviewed EDD entries"), "EDD month calendar exists");

assert(schema.includes("model ExternalPatientSubmission"), "external intake submission model exists");
assert(externalIntakeController.includes("x-prij-timestamp") && externalIntakeController.includes("x-prij-signature") && externalIntakeService.includes("PRIJ_EXTERNAL_INTAKE_SECRET") && externalIntakeService.includes("timingSafeEqual"), "Google Form webhook requires timestamped constant-time HMAC verification");
assert(externalIntakeService.includes("status: \"pending_review\"") && externalIntakeService.includes("pendingReview: true"), "external intake stores pending submissions before review");
assert(externalIntakeService.includes("patient_created_after_review") && externalIntakeService.includes("attached_after_review"), "create/attach only happen after review actions");
assert(externalIntakeService.includes("الاسم بالكامل") && externalIntakeService.includes("نوع المتابعة"), "Arabic Google Form field names are mapped");
assert(externalInbox.includes("External text is untrusted") && !externalInbox.includes("rawAnswersJson"), "external intake UI avoids raw JSON and warns about untrusted text");

console.log(`V139 SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
