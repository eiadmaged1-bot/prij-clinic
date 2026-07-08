import { readFileSync } from "node:fs";

const failures = [];
const read = (file) => readFileSync(file, "utf8");

const css = read("apps/web/app/globals.css");
const caseLibrary = read("apps/web/app/doctor/case-library/page.tsx");
const cleanup = read("apps/api/scripts/cleanup-demo-data.mjs");
const guard = read("scripts/no-demo-data-guard.mjs");
const investigations = read("apps/web/app/investigations/page.tsx");
const patients = read("apps/web/app/patients/page.tsx");
const newPatient = read("apps/web/app/patients/new/page.tsx");

for (const term of ["Demo Clinical", "Demo Workflow", "Archived fixture", "Test Intake", "Review DoctorUX", "Runtime", "QA", "fake CI"]) {
  if (!cleanup.includes(term)) failures.push(`cleanup-demo-data missing ${term}`);
  if (!guard.includes(term)) failures.push(`no-demo-data guard missing ${term}`);
}

if (!caseLibrary.includes("groupCases(cases)")) failures.push("Doctor Case Library must group cases by patient type.");
if (!caseLibrary.includes("Open patient") || !caseLibrary.includes("Open visit")) failures.push("Doctor Case Library must render action buttons instead of raw URLs.");
if (!caseLibrary.includes("regretful-unwomanly-silliness")) failures.push("Doctor Case Library must filter raw ngrok URL leakage.");
if (investigations.includes('apiGet("/patients")')) failures.push("Investigations must not preload all patients.");
if (!patients.includes("Search patient by name, phone, or file number.")) failures.push("Patient directory must be live-search first.");
if (!newPatient.includes("Doctor Quick Patient File")) failures.push("Doctor quick patient file UI is missing.");
if (!newPatient.includes("Patient registration is handled by reception.")) failures.push("Doctor no-permission message is missing.");

if (!css.includes("max-height: none") || !css.includes("overflow: visible")) failures.push("Mobile topbar must not clip controls.");
if (!css.includes("min-width: max-content")) failures.push("Mobile topbar actions must preserve language/logout controls.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("v1.4.2 minimal UX contract passed.");
