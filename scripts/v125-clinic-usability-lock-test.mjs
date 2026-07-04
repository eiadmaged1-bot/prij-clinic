import { readFile } from "node:fs/promises";
import { createPrisma } from "./v121-reference-utils.mjs";

const prisma = createPrisma();
const checks = [];
const failures = [];

try {
  await checkBrowserWorkflow();
  await checkMedicationSafetyReviewPrep();
  await checkRbac();
  await checkNoCodeLikeUi();
  await checkSafetyBoundaries();

  if (failures.length) {
    throw new Error(failures.join("\n"));
  }
  console.log(`V125-CLINIC-USABILITY-LOCK PASS ${JSON.stringify({ checks })}`);
} finally {
  await prisma.$disconnect();
}

async function checkBrowserWorkflow() {
  const patients = await read("apps/web/app/patients/page.tsx");
  const newPatient = await read("apps/web/app/patients/new/page.tsx");
  const workspace = await read("apps/web/app/patients/[id]/page.tsx");
  const doctorVisit = await read("apps/api/src/doctor-visit/doctor-visit.service.ts");

  assertIncludes(patients, "New Patient", "patient list has clear new patient action");
  assertIncludes(patients, "Search patient files", "patient list has search");
  assertIncludes(newPatient, "Save and open patient file", "patient creation opens workspace after save");
  assertIncludes(workspace, "Start Visit", "workspace has Start Visit action");
  for (const step of ["History", "Care Assist", "Encounter", "Prescription", "Investigations", "Follow-up", "Packet"]) {
    assertIncludes(workspace, step, `workspace includes ${step} step`);
    assertIncludes(doctorVisit, step, `backend visit workflow includes ${step} step`);
  }
  assertIncludes(workspace, "MedicationSafetyTerminal", "prescription flow shows side terminal");
  assertIncludes(workspace, "onMouseEnter", "medication hover updates terminal");
  assertIncludes(workspace, "onFocus", "medication keyboard focus updates terminal");
  assertIncludes(workspace, "Dose, frequency, and duration are not auto-filled.", "prescription does not auto-fill dose/frequency/duration");
  assertIncludes(workspace, "Selected investigation:", "investigation selection remains visible");
  assertIncludes(workspace, "Care Assist findings", "packet includes Care Assist findings");
  assertIncludes(workspace, "Requested investigations", "packet includes investigation names");
  assertIncludes(workspace, "Follow-up", "packet includes follow-up");
  checks.push("browser workflow surface is connected from patient creation through packet");
}

async function checkMedicationSafetyReviewPrep() {
  const component = await read("apps/web/components/care-assist/MedicationSafetyProfileSearch.tsx");
  const service = await read("apps/api/src/care-assist/medication-pregnancy-lactation-safety.service.ts");
  const controller = await read("apps/api/src/care-assist/care-assist.controller.ts");

  for (const label of ["Source name", "Source year", "Source link", "Last checked", "Source last updated", "Review status", "Confidence", "Approve", "Reject", "Retire"]) {
    assertIncludes(component, label, `review page shows ${label}`);
  }
  assertIncludes(component, "decideMedicationSafetyProfileReview", "review page saves through guarded endpoint");
  assertIncludes(controller, '@Permissions("medication_safety_profile.manage")', "review endpoint requires profile management permission");
  assertIncludes(service, 'categoryInput === "E" ? "REVIEW_REQUIRED"', "category E maps to review required");
  assertIncludes(service, "Reviewed medication safety profiles require a source name and review reason.", "reviewed status requires source and reason");
  assertIncludes(service, "reviewedByUserId: reviewStatus === \"reviewed\" ? user.id : null", "reviewer is saved by server");
  assertIncludes(service, "reviewedAt: reviewStatus === \"reviewed\" ? new Date() : null", "reviewed time is saved by server");
  assertIncludes(service, "medication_safety_profile.updated", "review changes are audited");
  checks.push("medication safety source review prep is guarded and audited");
}

async function checkRbac() {
  const owner = await rolePermissions("Owner");
  const admin = await rolePermissions("Admin");
  const receptionist = await rolePermissions("Receptionist");
  const accountant = await rolePermissions("Accountant");

  assert(owner.has("medication_safety_profile.manage"), "Owner lacks medication safety profile review permission");
  assert(admin.has("medication_safety_profile.manage"), "Admin lacks medication safety profile review permission");
  for (const [role, permissions] of [["Receptionist", receptionist], ["Accountant", accountant]]) {
    assert(!permissions.has("medication_safety_profile.manage"), `${role} can manage medication safety profiles`);
    assert(!permissions.has("care_assist.read") && !permissions.has("care_assist.evaluate"), `${role} can access advanced clinical safety support`);
  }
  checks.push("Owner/Admin allowed while receptionist/accountant denied advanced safety pages");
}

async function checkNoCodeLikeUi() {
  const files = [
    "apps/web/app/patients/page.tsx",
    "apps/web/app/patients/new/page.tsx",
    "apps/web/app/patients/[id]/page.tsx",
    "apps/web/components/care-assist/MedicationSafetyProfileSearch.tsx",
    "apps/web/components/medications/MedicationComponents.tsx"
  ];
  const text = (await Promise.all(files.map(read))).join("\n");
  for (const phrase of ["Admin/developer commands", "<pre><code>", "Demo/local packet", "demo trade name", "raw JSON", "stack trace", "API route", "localhost"]) {
    assert(!text.toLowerCase().includes(phrase.toLowerCase()), `code-like or demo wording remains in workflow UI: ${phrase}`);
  }
  checks.push("target workflow UI avoids code-like wording");
}

async function checkSafetyBoundaries() {
  const files = [
    "apps/web/app/patients/[id]/page.tsx",
    "apps/web/components/care-assist/MedicationSafetyProfileSearch.tsx",
    "apps/web/components/medications/MedicationSafetyTerminal.tsx",
    "apps/api/src/care-assist/medication-pregnancy-lactation-safety.service.ts",
    "apps/api/src/doctor-visit/doctor-visit.service.ts"
  ];
  const text = (await Promise.all(files.map(read))).join("\n").toLowerCase();
  for (const phrase of ["safe in pregnancy", "autonomous prescribing", "default dose", "recommended drug", "prescribe this"]) {
    assert(!text.includes(phrase), `forbidden clinical wording found: ${phrase}`);
  }
  const schema = await read("apps/api/prisma/schema.prisma");
  assert(!/enum\s+LegacyPregnancyCategory\s*{[^}]*\bE\b/s.test(schema), "category E is a valid pregnancy category");
  checks.push("no fake safety claims or category E valid state");
}

async function rolePermissions(roleName) {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    include: { rolePermissions: { include: { permission: true } } }
  });
  return new Set(role?.rolePermissions.map((item) => item.permission.key) ?? []);
}

async function read(path) {
  return readFile(path, "utf8");
}

function assertIncludes(source, needle, message) {
  assert(source.includes(needle), `${message}: missing ${needle}`);
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
