import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const packageJson = JSON.parse(read("package.json"));
const schema = read("apps/api/prisma/schema.prisma");
const billingService = read("apps/api/src/billing/billing.service.ts");
const billingDto = read("apps/api/src/billing/dto.ts");
const patientDto = read("apps/api/src/patients/dto.ts");
const patientService = read("apps/api/src/patients/patients.service.ts");
const billingPage = read("apps/web/app/billing/page.tsx");
const patientPage = read("apps/web/app/patients/[id]/page.tsx");
const operationsPage = read("apps/web/app/clinic-operations-page.tsx");
const settingsPage = read("apps/web/app/admin/settings/page.tsx");
const navigation = read("apps/web/app/navigation-registry.ts");
const walkthrough = read("apps/web/app/clinic-day/walkthrough/page.tsx");
const newPatient = read("apps/web/app/patients/new/page.tsx");
const checkIn = read("apps/web/app/reception/check-in/page.tsx");
const doctorVisit = read("apps/web/app/doctor/visit/page.tsx");
const prescriptions = read("apps/web/app/prescriptions/page.tsx");
const investigations = read("apps/web/app/investigations/page.tsx");

assert(packageJson.scripts["test:v150:mvp-business-walkthrough"] === "node scripts/v150-mvp-business-walkthrough-test.mjs", "v0.15.0 business walkthrough test script is registered");
assert(walkthrough.includes("Run clinic day demo") && navigation.includes("/clinic-day/walkthrough"), "clinic walkthrough route and launcher remain discoverable");
assert(!newPatient.includes(">Sex<") && !newPatient.includes("Patient type") && newPatient.includes("sex: \"female\""), "new patient lock remains in place");
assert(checkIn.includes("<PatientPicker") && !/Patient ID/i.test(checkIn.replace("patientId: selectedPatient.id", "")), "check-in remains PatientPicker based");
assert(operationsPage.includes("current-in-room-patient-compact") && operationsPage.includes("Continue visit"), "doctor waiting compact workflow remains locked");
assert(doctorVisit.includes("No automatic prescribing") && doctorVisit.includes("does not diagnose automatically"), "doctor visit safety lock remains");
assert(prescriptions.includes("doctor must manually review") && !/auto.?dose|auto.?prescrib/i.test(prescriptions), "prescription remains manual and generic-first");
assert(investigations.includes("<PatientPicker") && investigations.includes("Attach to patient"), "investigations remain visible and patient-linked");
assert(patientPage.includes("follow-up-hints") && patientPage.includes("Print packet"), "follow-up and packet discoverability remains");

for (const field of ["appointmentId", "queueTicketId", "encounterId"]) {
  assert(schema.includes(field) && billingDto.includes(field) && patientDto.includes(field), `invoice supports ${field} context`);
}
assert(billingService.includes("resolveBillingContext") && patientService.includes("resolvePatientBillingContext"), "visit/check-in context is validated before invoice creation");
assert(schema.includes("model ServiceItem") && billingPage.includes("Owner service catalog") && patientPage.includes("Owner service catalog"), "service selection uses Owner Service Catalog");
assert(billingPage.includes("Create invoice") && patientPage.includes("Create draft invoice"), "draft invoice creation exists from selected services");
assert(billingPage.includes("/issue") && billingPage.includes("Issue"), "invoice issue action exists");
assert(billingPage.includes("/void") && billingPage.includes("Void reason is required"), "invoice void requires a reason");
assert(billingPage.includes("Patient statement") && billingService.includes("patientStatement"), "patient statement source and page exist");
assert(schema.includes("draft") && schema.includes("issued") && schema.includes("partially_paid") && schema.includes("paid") && schema.includes("voided"), "invoice statuses include MVP states");
assert(schema.includes("cash") && schema.includes("card") && schema.includes("transfer") && schema.includes("other"), "manual payment methods include cash card transfer other");
assert(billingPage.includes("Manual payments only") && billingPage.includes("No card numbers or secrets") && !/payment gateway/i.test(billingPage.replaceAll("No payment gateway", "")), "manual payment UI avoids gateway/card storage wording");
assert(operationsPage.includes("Payments collected") && operationsPage.includes("Outstanding balances") && operationsPage.includes("Follow-ups due"), "daily reports include MVP business summaries");
assert(operationsPage.includes("Owner daily summary") && operationsPage.includes("Reception daily summary") && operationsPage.includes("Doctor daily summary"), "owner reception doctor summary cards exist");
assert(settingsPage.includes("Clinic name") && settingsPage.includes("Phone and address") && settingsPage.includes("Working hours") && settingsPage.includes("Currency default") && settingsPage.includes("Receipt footer note"), "clinic settings polish fields are visible");
assert(navigation.includes("Reports") && navigation.includes("Admin Services") && navigation.includes("Medication Safety Review"), "MVP navigation includes business destinations");
assert(billingService.includes("invoice.created") && billingService.includes("invoice.issued") && billingService.includes("invoice.voided") && billingService.includes("payment.recorded"), "billing audit strings exist");
assert(patientService.includes("manualOnly") && billingService.includes("manualOnly"), "manual payments are marked in audit metadata");
assert(!/raw JSON|schema\.prisma|stack trace|developer wording/i.test(`${billingPage}\n${patientPage}\n${operationsPage}`), "normal UI avoids raw JSON/code/schema/stack wording");
assert(!/automatic diagnosis|automatic prescribing|automatic dosing/i.test(`${billingPage}\n${operationsPage}\n${patientPage}`), "business UI does not add automatic clinical behavior");
assert(!/medication.*price|price.*medication/i.test(`${billingPage}\n${patientPage}`), "service prices do not leak into medication catalog wording");

console.log(`v0.15.0 MVP business walkthrough checks passed (${checks.length})`);
