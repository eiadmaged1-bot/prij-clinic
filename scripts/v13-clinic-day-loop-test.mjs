import { readFile } from "node:fs/promises";
import { createPrisma } from "./v121-reference-utils.mjs";

const prisma = createPrisma();
const checks = [];
const failures = [];

try {
  await checkRoutes();
  await checkDailyLoopUi();
  await checkServiceInvoiceAndDocuments();
  await checkRbac();
  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`V13-CLINIC-DAY-LOOP PASS ${JSON.stringify({ checks })}`);
} finally {
  await prisma.$disconnect();
}

async function checkRoutes() {
  for (const path of [
    "apps/web/app/reception/today/page.tsx",
    "apps/web/app/reception/check-in/page.tsx",
    "apps/web/app/calendar/page.tsx",
    "apps/web/app/queue/page.tsx",
    "apps/web/app/doctor/waiting/page.tsx",
    "apps/web/app/clinic-operations-page.tsx"
  ]) {
    assert((await read(path)).length > 0, `missing route ${path}`);
  }
  checks.push("reception, calendar, queue, and doctor waiting routes exist");
}

async function checkDailyLoopUi() {
  const ops = await read("apps/web/app/clinic-operations-page.tsx");
  const reception = await read("apps/web/app/reception/today/page.tsx");
  for (const text of ["Scheduled", "Checked in", "Waiting", "With doctor", "Completed", "cancellation", "no-show", "Start or resume visit", "Pending orders"]) {
    assertIncludes(ops + reception, text, `daily loop text ${text}`);
  }
  for (const text of ["patient workspace", "invoice", "payment", "doctor", "visit reason", "walk-in"]) {
    assert((ops + reception).toLowerCase().includes(text), `reception handoff missing ${text}`);
  }
  checks.push("appointment to queue to doctor handoff is visible");
}

async function checkServiceInvoiceAndDocuments() {
  const patientPage = await read("apps/web/app/patients/[id]/page.tsx");
  const docsPage = await read("apps/web/app/documents/page.tsx");
  const service = await read("apps/api/src/patients/patients.service.ts");
  for (const text of ["Invoice", "Payment", "Print statement", "Service", "Create invoice", "Record payment"]) {
    assertIncludes(patientPage, text, `visit invoice UI ${text}`);
  }
  assertIncludes(service, "invoice.created", "patient invoice creation is audited");
  assertIncludes(service, "payment.recorded", "patient payment recording is audited");
  for (const text of ["Documents and results", "Metadata protected", "metadata stripping", "raw storage paths"]) {
    assertIncludes(docsPage + (await read("apps/web/app/clinic-operations-page.tsx")), text, `document timeline text ${text}`);
  }
  checks.push("service selection, invoice link, payment note, and document timeline surfaces exist");
}

async function checkRbac() {
  const receptionist = await rolePermissions("Receptionist");
  const accountant = await rolePermissions("Accountant");
  for (const [role, permissions] of [["Receptionist", receptionist], ["Accountant", accountant]]) {
    assert(!permissions.has("care_assist.evaluate"), `${role} can evaluate Care Assist`);
    assert(!permissions.has("medications.safety_check"), `${role} can open medication safety checks`);
    assert(!permissions.has("medication_safety_profile.manage"), `${role} can manage medication safety profiles`);
  }
  checks.push("receptionist and accountant remain blocked from advanced clinical safety tools");
}

async function rolePermissions(roleName) {
  const role = await prisma.role.findUnique({ where: { name: roleName }, include: { rolePermissions: { include: { permission: true } } } });
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
