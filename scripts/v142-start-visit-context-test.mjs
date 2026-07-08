import fs from "node:fs";

const checks = [
  ["locked active visit route exists", "apps/web/app/patients/[id]/visits/[visitId]/[[...module]]/page.tsx", "ActiveVisitWorkspace"],
  ["old bare guided route blocks editor", "apps/web/app/doctor/visit/page.tsx", "Patient context is required before documenting this visit."],
  ["old route redirects to locked route", "apps/web/app/doctor/visit/page.tsx", "window.location.replace(`/patients/${patientId}/visits/${visitId}/encounter`)"],
  ["doctor home no bare start visit", "apps/web/app/doctor/page.tsx", "Choose patient to start"],
  ["patient file uses active visit launcher", "apps/web/app/patients/[id]/page.tsx", "ActiveVisitLauncher"]
];

for (const [label, file, needle] of checks) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

console.log("v1.4.2 start visit context contract passed.");
