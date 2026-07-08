import fs from "node:fs";

const prescriptionService = fs.readFileSync("apps/api/src/prescriptions/prescriptions.service.ts", "utf8");
const investigationService = fs.readFileSync("apps/api/src/investigations/investigations.service.ts", "utf8");
const pregnancyService = fs.readFileSync("apps/api/src/pregnancy/pregnancy.service.ts", "utf8");
const prescriptionsPage = fs.readFileSync("apps/web/app/prescriptions/page.tsx", "utf8");
const investigationsPage = fs.readFileSync("apps/web/app/investigations/page.tsx", "utf8");

const guards = [
  [prescriptionService, "Patient and active visit context are required before saving a prescription draft."],
  [investigationService, "Patient and active visit context are required before saving an investigation request."],
  [pregnancyService, "Patient and active visit context are required before saving an ultrasound report."],
  [prescriptionsPage, "Prescription inherits patient and visit context."],
  [investigationsPage, "Investigations inherit patient and visit context."]
];

for (const [text, needle] of guards) {
  if (!text.includes(needle)) throw new Error(`patient-context module guard missing: ${needle}`);
}

if (/safe in pregnancy/i.test(`${prescriptionService}\n${prescriptionsPage}`)) {
  throw new Error("Do not use safe in pregnancy wording.");
}

console.log("v1.4.2 patient-context module contract passed.");
