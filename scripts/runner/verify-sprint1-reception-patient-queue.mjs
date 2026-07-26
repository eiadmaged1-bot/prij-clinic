import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const search = read("apps/api/src/patients/services/patient-search.service.ts");
const controller = read("apps/api/src/patients/patients.controller.ts");
const picker = read("apps/web/components/clinic/PatientPicker.tsx");
const checkIn = read("apps/web/app/reception/check-in/page.tsx");
const qr = read("apps/web/app/reception/qr-scan/page.tsx");
const directory = read("apps/web/app/patients/page.tsx");
const newPatient = read("apps/web/app/patients/new/page.tsx");
const patientService = read("apps/api/src/patients/patients.service.ts");
const queue = read("apps/api/src/queue/queue.service.ts");

const checks = [
  [search, "firstName: { contains: query", "first-name search"],
  [search, "lastName: { contains: query", "last-name search"],
  [search, "medicalRecordNumber: { equals: query", "MRN exact search"],
  [search, "phone: { contains: normalizedPhone", "normalized phone search"],
  [search, "pageInfo: { page, limit, hasMore", "patient pagination response"],
  [controller, '@Query("branchId")', "branch filter"],
  [controller, '@Query("patientType")', "patient-type filter"],
  [picker, ">Select</button>", "explicit patient selection"],
  [picker, "setSelectedSnapshot(patient)", "selected patient snapshot"],
  [picker, "Load more patients", "patient-picker pagination"],
  [checkIn, '"idempotency-key": idempotencyKey', "idempotent check-in"],
  [checkIn, "patientId: selectedPatient.id", "selected patient check-in"],
  [directory, 'mode: "directory"', "directory mode"],
  [directory, "pageInfo", "directory pagination state"],
  [directory, 'value="last_visit_desc"', "last-visit sort"],
  [directory, 'value="all"', "all-branch option"],
  [directory, 't("lastVisitRecent")', "translated last-visit label"],
  [directory, 't("allPermittedBranches")', "translated all-branch label"],
  [patientService, 'status: "active"', "active-patient creation"],
  [newPatient, "addCreatedPatientToQueue(createdPatientId)", "new-patient queue handoff"],
  [queue, 'status: { in: ["waiting", "called", "in_room"] }', "active queue states"],
  [queue, "queueResponse(activeTicket, true)", "already-queued replay"],
  [queue, "DOCTOR_ROOM_OCCUPIED", "single doctor-room invariant"],
  [queue, "QUEUE_SELECTION_CONFLICT", "concurrent selection protection"]
];

for (const [source, needle, label] of checks) {
  if (!source.includes(needle)) throw new Error("Reception patient/queue contract missing: " + label + " -> " + needle);
}
if (picker.includes("Include archived")) throw new Error("Operational patient picker must not expose archived records.");
if (checkIn.includes("must be restored before Check-in")) throw new Error("Check-in must use the selected accessible patient directly.");
if (qr.includes('patient.status !== "archived"')) throw new Error("QR selection must rely on server access scope rather than a client-only status gate.");
if (newPatient.includes('response.status === 409) return { kind: "already"')) throw new Error("New-patient creation must not silently treat a conflict as success.");

console.log("Sprint 1 reception patient selection and queue workflow PASS");
