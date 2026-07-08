import fs from "node:fs";

const workspace = fs.readFileSync("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8");
const identity = fs.readFileSync("apps/web/components/clinic/PatientVisitIdentityBar.tsx", "utf8");

const required = [
  "PatientVisitIdentityBar",
  "data-locked-patient-bar",
  "complaint",
  "history",
  "examination",
  "impression",
  "prescription",
  "investigations",
  "ultrasound",
  "follow-up",
  "finish",
  "Documentation shortcuts only. No automatic diagnosis, treatment, or clinical action.",
  "No saved prescription templates yet.",
  "Search medication catalog first.",
  "No active pregnancy episode recorded."
];

for (const needle of required) {
  if (!workspace.includes(needle) && !identity.includes(needle)) throw new Error(`active visit workspace missing: ${needle}`);
}

if (/PatientPicker/.test(workspace)) throw new Error("active visit workspace must not render a patient picker.");
if (!workspace.includes("examinationChips")) throw new Error("examination chips must be section-specific.");

console.log("v1.4.2 core visit workspace contract passed.");
