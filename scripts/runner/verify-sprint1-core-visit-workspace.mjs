import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const workspace = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");
const identity = read("apps/web/components/clinic/PatientVisitIdentityBar.tsx");

const required = [
  "PatientVisitIdentityBar",
  "complaint",
  "history",
  "examination",
  "impression",
  "prescription",
  "investigations",
  "ultrasound",
  "follow-up",
  "finish",
  "Search medication catalog first.",
  "No saved prescription templates yet.",
  "Patient-aware safety panel",
  "Sign and lock this visit?",
  "Signed visit · read only",
  "No automatic FGR, anomaly, or treatment labels."
];
for (const needle of required) {
  if (!workspace.includes(needle)) throw new Error(`Current core visit workspace missing: ${needle}`);
}
if (!identity.includes("data-locked-patient-bar")) throw new Error("Locked patient identity bar is missing.");
if (!identity.includes("MRN")) throw new Error("Locked patient identity must display MRN.");
if (!workspace.includes("examinationChips")) throw new Error("Section-specific examination chips are missing.");
if (!workspace.includes("SignedVisitReadOnlyNotice")) throw new Error("Signed-record module boundary is missing.");
if (workspace.includes("PatientPicker")) throw new Error("Active visit workspace must not render a patient picker.");

console.log("Sprint 1 current core visit workspace PASS");
