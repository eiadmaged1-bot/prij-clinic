import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const lockedRoute = read("apps/web/app/patients/[id]/visits/[visitId]/[[...module]]/page.tsx");
const compatibilityRoute = read("apps/web/app/doctor/visit/page.tsx");
const doctorHome = read("apps/web/app/doctor/page.tsx");
const patientPage = read("apps/web/app/patients/[id]/page.tsx");
const workspace = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");

const checks = [
  ["locked route renders active workspace", lockedRoute, "ActiveVisitWorkspace patientId={id} visitId={visitId}"],
  ["compatibility route blocks missing patient", compatibilityRoute, "Patient context is required before documenting this visit."],
  ["compatibility route redirects to locked visit", compatibilityRoute, "window.location.replace(`/patients/${patientId}/visits/${visitId}/encounter`)"],
  ["doctor home starts through patient-bound launcher", doctorHome, "ActiveVisitLauncher"],
  ["doctor home states patient context boundary", doctorHome, "Patient context opens before any clinical action."],
  ["patient file launches active visit", patientPage, "ActiveVisitLauncher"],
  ["workspace verifies patient and encounter IDs", workspace, "encounter?.patientId === patientId"],
  ["workspace has locked identity bar", workspace, "PatientVisitIdentityBar"]
];

for (const [label, source, needle] of checks) {
  if (!source.includes(needle)) throw new Error(`Locked-context regression missing: ${label} -> ${needle}`);
}
if (doctorHome.includes('href="/doctor/visit"')) throw new Error("Doctor home must not expose a bare visit editor route.");
if (workspace.includes("PatientPicker")) throw new Error("Active visit workspace must not render a patient picker.");

console.log("Sprint 1 locked patient visit context PASS");
