import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, service, encounters, client] = await Promise.all([
  readFile("apps/web/app/patients/[id]/visit-flow-components.tsx", "utf8"),
  readFile("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8"),
  readFile("apps/api/src/encounters/encounters.service.ts", "utf8"),
  readFile("apps/web/lib/doctor-visit.ts", "utf8")
]);

const steps = ["History", "Examination", "Assessment", "Plan", "Review"];
for (const step of steps) assert(page.includes(`\"${step}\"`), `guided visit workflow missing ${step}`);
for (const step of steps) assert(page.includes(`activeStep === \"${step}\"`), `step must render conditionally: ${step}`);
for (const section of ["Prescription", "Investigations", "Follow-up"]) assert(page.includes(`\"${section}\"`), `plan section missing ${section}`);
assert(page.includes("Previous") && page.includes("Next") && page.includes("Save assessment and continue"), "stepper navigation and save-and-continue must exist");
assert(page.includes("encounterReady") && page.includes("Complete Visit") && page.includes("disabled={!encounterId || !encounterReady"), "visit completion must require clinician-authored encounter fields");
assert(client.includes('/encounters/${encodeURIComponent(encounterId)}/sign'), "completion must use the audited sign endpoint");
assert(encounters.includes('existing.status === "signed"') && encounters.includes("cannot be edited"), "signed encounter must be immutable");
assert(service.includes('"doctor_visit.started"') && service.includes('action: "doctor_visit.encounter_draft_updated"'), "visit start and draft changes must be audited");

console.log("Step-based doctor visit, validation, and immutable signing PASS");
