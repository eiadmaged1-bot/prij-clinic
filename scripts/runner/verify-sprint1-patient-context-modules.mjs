import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const workspace = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");
const investigations = read("apps/web/components/investigations/InvestigationStationV3.tsx");
const client = read("apps/web/lib/doctor-visit.ts");

const workspaceChecks = [
  ["patient and encounter gate", "encounter?.patientId === patientId"],
  ["medication search", '/medications/search'],
  ["prescription save", 'apiPost("/prescriptions"'],
  ["investigation locked patient", "lockedPatientId={patientId}"],
  ["investigation locked encounter", "lockedEncounterId={visitId}"],
  ["ultrasound inside locked visit", "<UltrasoundModule readOnly={signedVisit}"],
  ["follow-up bound to patient and visit", "createDoctorVisitFollowUp(patientId, visitId"],
  ["signed investigation boundary", "SignedVisitReadOnlyNotice"],
  ["identity bar", "PatientVisitIdentityBar"]
];
for (const [label, needle] of workspaceChecks) {
  if (!workspace.includes(needle)) throw new Error(`Patient-context module contract missing: ${label} -> ${needle}`);
}

const investigationChecks = [
  "lockedPatientId = \"\"",
  "lockedEncounterId = \"\"",
  "const initialPatientId = lockedPatientId",
  "const initialEncounterId = lockedEncounterId",
  "setPatientId(initialPatientId)",
  "setEncounterId(initialEncounterId)"
];
for (const needle of investigationChecks) {
  if (!investigations.includes(needle)) throw new Error(`Investigation locked-context contract missing: ${needle}`);
}

if (!client.includes("createDoctorVisitFollowUp(patientId: string, encounterId: string")) throw new Error("Follow-up client must require patient and encounter IDs.");
if (!client.includes("updateDoctorVisit(patientId: string, encounterId: string")) throw new Error("Visit update client must require patient and encounter IDs.");
if (!client.includes("completeDoctorVisit(patientId: string, encounterId: string")) throw new Error("Visit completion client must require patient and encounter IDs.");
if (workspace.includes("PatientPicker")) throw new Error("Active visit modules must never switch patient context.");

console.log("Sprint 1 patient-context clinical modules PASS");
