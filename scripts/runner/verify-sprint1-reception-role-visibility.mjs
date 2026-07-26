import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const permissions = read("packages/shared/src/permissions.ts");
const shell = read("apps/web/app/mvp-page.tsx");
const reception = read("apps/web/app/reception/page.tsx");
const doctor = read("apps/web/app/doctor/page.tsx");
const activeVisit = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");
const queueController = read("apps/api/src/queue/queue.controller.ts");

for (const needle of [
  "[Role.OWNER]: Object.values(Action)",
  "[Role.DOCTOR]",
  "Action.VISIT_START",
  "Action.VISIT_RESUME",
  "Action.VISIT_FINISH",
  "[Role.RECEPTIONIST]",
  "Action.PATIENT_REGISTER",
  "Action.APPOINTMENT_MANAGE",
  "Action.QUEUE_CHECKIN",
  "Action.QUEUE_STATUS_UPDATE"
]) {
  if (!permissions.includes(needle)) throw new Error("Role permission contract missing: " + needle);
}

const receptionistBlock = permissions.slice(permissions.indexOf("[Role.RECEPTIONIST]"), permissions.indexOf("[Role.ACCOUNTANT]"));
for (const forbidden of ["Action.VISIT_START", "Action.VISIT_RESUME", "Action.VISIT_FINISH", "Action.ENCOUNTER_CREATE", "Action.PRESCRIPTION_SIGN", "Action.INVESTIGATION_RESULT_REVIEW", "Action.ADMIN_SETTINGS"]) {
  if (receptionistBlock.includes(forbidden)) throw new Error("Receptionist role must not receive clinical/admin action: " + forbidden);
}

for (const needle of [
  "isReceptionistOnly ? [] : buildShellNavGroups",
  "receptionist-shell no-sidebar",
  "!isReceptionistOnly ? <UniversalSearchBox /> : null",
  "receptionist-topbar-actions",
  "LanguageSwitcher",
  "signOut()"
]) {
  if (!shell.includes(needle)) throw new Error("Reception shell visibility contract missing: " + needle);
}

for (const forbidden of ["ActiveVisitLauncher", "Prescription", "Owner Control", "Admin Console", "Doctor workspace"]) {
  if (reception.includes(forbidden)) throw new Error("Reception Home must not expose clinical/admin UI: " + forbidden);
}

for (const needle of ["ActiveVisitLauncher", "Action.VISIT_START", "Resume active visit", "Open next patient"]) {
  if (!doctor.includes(needle)) throw new Error("Doctor role workflow contract missing: " + needle);
}
for (const needle of ["canUseDoctorVisit", "Action.VISIT_START", "signedVisit", "PatientVisitIdentityBar"]) {
  if (!activeVisit.includes(needle)) throw new Error("Active visit role/safety contract missing: " + needle);
}
if (!queueController.includes('@Permissions("doctor_queue.select_patient")')) throw new Error("Doctor queue selection permission is missing.");

console.log("Sprint 1 receptionist and doctor role visibility PASS");
