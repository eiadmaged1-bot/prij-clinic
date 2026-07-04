import { readFile } from "node:fs/promises";
import { createPrisma } from "./v121-reference-utils.mjs";

const prisma = createPrisma();
const checks = [];
const failures = [];

try {
  await checkOwnerControl();
  await checkServiceCatalog();
  await checkGynecologyWorkspace();
  await checkSafetyWording();

  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`V128-OWNER-CONTROL-GYN PASS ${JSON.stringify({ checks })}`);
} finally {
  await prisma.$disconnect();
}

async function checkOwnerControl() {
  const controller = await read("apps/api/src/rbac/admin.controller.ts");
  const service = await read("apps/api/src/rbac/rbac.service.ts");
  const adminPage = await read("apps/web/app/admin/page.tsx");
  const settingsPage = await read("apps/web/app/admin/settings/page.tsx");
  const auditPage = await read("apps/web/app/admin/audit/page.tsx");

  for (const route of ['@Get("control-center")', '@Get("services")', '@Post("services")', '@Patch("services/:id")', '@Post("services/:id/deactivate")', '@Post("services/:id/reactivate")']) {
    assertIncludes(controller, route, `admin route exists ${route}`);
  }
  assertIncludes(service, "assertOwnerOrAdmin", "owner/admin backend guard exists");
  assertIncludes(service, "Owner or admin access is required.", "non-owner/admin denial is explicit");
  assertIncludes(adminPage, "Owner Control Center", "owner control center renders");
  assertIncludes(settingsPage, "Clinic Settings", "settings shell renders");
  assertIncludes(auditPage, "Audit Log", "audit shell renders");

  const owner = await rolePermissions("Owner");
  const admin = await rolePermissions("Admin");
  const receptionist = await rolePermissions("Receptionist");
  const accountant = await rolePermissions("Accountant");
  assert(owner.has("clinic_settings.manage"), "Owner cannot manage clinic settings");
  assert(admin.has("clinic_settings.manage"), "Admin cannot manage clinic settings");
  assert(!receptionist.has("clinic_settings.manage"), "Receptionist can manage owner settings");
  assert(!accountant.has("clinic_settings.manage"), "Accountant can manage owner settings");
  checks.push("owner/admin can access control center while receptionist/accountant are denied");
}

async function checkServiceCatalog() {
  const schema = await read("apps/api/prisma/schema.prisma");
  const service = await read("apps/api/src/rbac/rbac.service.ts");
  const adminPage = await read("apps/web/app/admin/page.tsx");

  for (const field of ["code", "name", "category", "price", "currency", "active", "costAmount", "doctorShareAmount", "createdAt", "updatedAt"]) {
    assertIncludes(schema, field, `service catalog field ${field}`);
  }
  assertIncludes(service, "service_item.created", "service create is audited");
  assertIncludes(service, "service_item.updated", "service update is audited");
  assertIncludes(service, "service_item.deactivated", "service deactivate is audited");
  assertIncludes(service, "A reason is required for service price or status changes.", "price/status changes require a reason");
  assertIncludes(adminPage, "Medication Data Operations", "medication review remains separate");
  assertIncludes(adminPage, "Service Catalog and Prices", "service catalog UI renders");
  checks.push("service price catalog has billing-only fields and audited price/status changes");
}

async function checkGynecologyWorkspace() {
  const patientPage = await read("apps/web/app/patients/[id]/page.tsx");
  const dto = await read("apps/api/src/gynecology/dto.ts");
  const service = await read("apps/api/src/gynecology/gynecology.service.ts");

  for (const label of ["Summary", "Doctor Visit", "Gynecology", "History", "Prescriptions", "Investigations", "Billing", "Documents", "Medication Safety", "Timeline"]) {
    assertIncludes(patientPage, `label: "${label}"`, `focused patient tab ${label}`);
  }
  for (const label of ["Start Gynecology Visit", "Gynecology visit", "Abnormal bleeding", "Pelvic pain", "PCOS", "Fibroid or ovarian cyst", "Contraception counseling"]) {
    assertIncludes(patientPage, label, `gynecology UI label ${label}`);
  }
  for (const field of ["reasonForVisit", "menstrualHistory", "bleedingPattern", "painSymptoms", "dischargeSymptoms", "contraceptionHistory", "medicalSurgicalHistory", "examinationNotes", "doctorImpression", "doctorPlan", "followUpDate"]) {
    assertIncludes(dto, field, `general gynecology field ${field}`);
  }
  for (const field of ["cycleRegularity", "pregnancyTestNote", "painOnset", "urinaryBowelSymptoms", "acneHirsutismNote", "ultrasoundNote", "findingSource", "sizeLocationNote", "contraindicationChecklist", "counselingNotes", "chosenMethod"]) {
    assertIncludes(dto, field, `starter gynecology field ${field}`);
  }
  assertIncludes(service, "recording_only_clinician_interpretation_required", "gynecology audit marks recording-only");
  checks.push("gynecology workspace and starter templates render as recording aids");
}

async function checkSafetyWording() {
  const files = [
    "apps/web/app/admin/page.tsx",
    "apps/web/app/admin/settings/page.tsx",
    "apps/web/app/admin/services/page.tsx",
    "apps/web/app/admin/audit/page.tsx",
    "apps/web/app/patients/[id]/page.tsx"
  ];
  const text = (await Promise.all(files.map(read))).join("\n");
  for (const phrase of ["automatic diagnosis", "automatic prescribing", "recommended treatment", "recommended drug", "dose suggestion", "best treatment", "raw JSON", "stack trace", "Prisma", "schema.prisma", "localhost"]) {
    assert(!text.toLowerCase().includes(phrase.toLowerCase()), `forbidden wording found: ${phrase}`);
  }
  const adminPage = await read("apps/web/app/admin/page.tsx");
  assert(!/medication reference.*service price|service price.*medication reference/i.test(adminPage), "service prices appear mixed with medication reference prices");
  checks.push("no automatic clinical or code-like UI wording found in v128 surfaces");
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
