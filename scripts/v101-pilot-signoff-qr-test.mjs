import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const checks = [];

function read(path) {
  return readFileSync(path, "utf8");
}

function pass(message) {
  checks.push(message);
  console.log(`V101-QR PASS ${message}`);
}

function assertIncludes(source, value, message) {
  assert(source.includes(value), message);
  pass(message);
}

function assertNotIncludes(source, value, message) {
  assert(!source.includes(value), message);
  pass(message);
}

const reception = read("apps/web/app/reception/page.tsx");
const checkIn = read("apps/web/app/reception/check-in/page.tsx");
const scanner = read("apps/web/app/reception/qr-scan/page.tsx");
const patientFile = read("apps/web/app/patients/[id]/page.tsx");
const patientQr = read("apps/web/lib/patient-qr.ts");
const patientsController = read("apps/api/src/patients/patients.controller.ts");
const patientsService = read("apps/api/src/patients/patients.service.ts");
const queueController = read("apps/api/src/queue/queue.controller.ts");
const pkg = read("package.json");
const css = read("apps/web/app/globals.css");

assert(existsSync("apps/web/app/reception/qr-scan/page.tsx"), "QR scanner route exists");
pass("QR scanner route exists");

assertIncludes(reception, "<h2>Waiting List</h2>", "reception home shows waiting list");
assertIncludes(reception, "New Patient", "reception home shows New Patient large card");
assertIncludes(reception, "Returning Patient", "reception home shows Returning Patient large card");
assertIncludes(reception, 'href="/patients/new"', "New Patient opens patients new route");
assertIncludes(reception, "setLookupOpen", "Returning Patient opens focused lookup panel");
assertIncludes(reception, "patient?.id", "Returning Patient search supports patient ID");
assertIncludes(reception, "medicalRecordNumber", "Returning Patient search supports MRN");
assertIncludes(reception, "phone", "Returning Patient search supports phone number");
assertIncludes(reception, 'href="/reception/qr-scan"', "Scan QR button is available from reception");
assertIncludes(checkIn, 'href="/reception/qr-scan"', "Scan QR button is available from check-in");

for (const forbidden of ["total patients today", "total patients yesterday", "total visits this week", "Owner daily summary", "paymentsToday"]) {
  assertNotIncludes(reception.toLowerCase(), forbidden.toLowerCase(), `reception home does not show ${forbidden}`);
}

assertIncludes(patientFile, "Patient QR", "patient file shows Patient QR");
assertIncludes(patientFile, "patientQrSvgDataUri(patient.id)", "QR image is generated from patient ID only");
assertIncludes(patientFile, "data-qr-payload={patient.id}", "QR payload marker contains patient ID only");
for (const forbidden of ["patient.phone", "dateOfBirth", "diagnosis", "chiefComplaint", "clinicalImpression", "doctorPlan", "notes"]) {
  assert(!patientFile.slice(patientFile.indexOf("function PatientQrModal"), patientFile.indexOf("function MorePatientSections")).includes(forbidden), `Patient QR modal does not include ${forbidden}`);
  pass(`Patient QR modal does not include ${forbidden}`);
}
assertIncludes(patientQr, "encodeData(value)", "QR utility encodes a single payload value");

assertIncludes(scanner, "BarcodeDetector", "scanner supports browser QR scanning when available");
assertIncludes(scanner, "Patient ID from QR", "scanner has required manual patient ID fallback");
assertIncludes(scanner, "/patients/${encodeURIComponent(patientId)}/qr", "scanner resolves patient by QR patient ID");
assertIncludes(scanner, "router.push(`/patients/${encodeURIComponent(patient.patientId)}`)", "successful scan opens patient file");
assertIncludes(scanner, "/queue/check-in", "scanner exposes check-in/add-to-queue action after resolve");
assertIncludes(scanner, "No patient found for this QR.", "invalid QR shows clean safe message");
assertIncludes(scanner, "Check your role", "restricted check-in shows clean role message");
assertIncludes(scanner, "response.status === 401", "anonymous QR resolve is handled as sign-in required");

assertIncludes(patientsController, "@UseGuards(JwtAuthGuard, PermissionsGuard)", "patient QR API remains authenticated");
assertIncludes(patientsController, '@Get(":id/qr")', "patient QR resolve endpoint exists");
assertIncludes(patientsController, '@Permissions("patient.read")', "patient QR resolve requires patient read permission");
assertIncludes(patientsService, "action: \"patient.qr_resolved\"", "patient QR resolve is audited");
assertIncludes(patientsService, "patientIdOnly: true", "patient QR audit records patient-ID-only safety");
assertIncludes(queueController, '@Permissions("queue.manage")', "QR check-in remains protected by queue permission");

assertIncludes(pkg, '"test:v101:pilot-signoff-qr"', "package exposes v1.0.1 QR signoff test");
assertIncludes(css, ".reception-home-grid", "reception clean home styling exists");
assertIncludes(css, ".patient-qr-modal", "patient QR modal styling exists");
assertIncludes(css, ".qr-video", "QR scanner video styling exists");

for (const [label, source] of [
  ["reception home", reception],
  ["QR scanner", scanner],
  ["patient file", patientFile]
]) {
  assert(!/<pre>|raw JSON|schema\.prisma|Prisma|JWT_SECRET|DATABASE_URL|stack trace|Unhandled Runtime Error/i.test(source), `${label} normal UI avoids raw technical wording`);
  pass(`${label} normal UI avoids raw technical wording`);
}

assertIncludes(scanner, "Phone camera scanning may require HTTPS", "manual phone QA HTTPS limitation is visible in scanner");

console.log(`V101-QR SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
