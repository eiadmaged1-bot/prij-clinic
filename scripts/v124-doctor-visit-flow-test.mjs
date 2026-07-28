import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [router, controller, cockpit, renderer, careAssistPanel, decisionControls, doctorVisitController, doctorVisitService, appModule] = await Promise.all([
  readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8"),
  readFile("apps/web/components/clinic/SharedEncounterWorkspaceController.tsx", "utf8"),
  readFile("apps/web/components/clinic/VisitCockpitWorkspace.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/workspace-module-renderer.tsx", "utf8"),
  readFile("apps/web/components/care-assist/CareAssistPanel.tsx", "utf8"),
  readFile("apps/web/components/care-assist/CareAssistDecisionControls.tsx", "utf8"),
  readFile("apps/api/src/doctor-visit/doctor-visit.controller.ts", "utf8"),
  readFile("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8"),
  readFile("apps/api/src/app.module.ts", "utf8")
]);

assert.match(renderer, /ActiveVisitLauncher/, "patient workspace launches the authoritative doctor visit");
assert.doesNotMatch(renderer, /ClinicalInputFoundation patient=\{patient\}/, "patient workspace does not expose a competing local-only visit draft");
assert.equal((router.match(/useSharedEncounterWorkspaceController\(/g) ?? []).length, 1, "one shared encounter controller owns both presentations");
assert.match(router, /ClassicDoctorWorkspace controller=\{controller\}/, "Classic consumes the shared controller");
assert.match(router, /VisitCockpitWorkspace controller=\{controller\}/, "Cockpit consumes the shared controller");
for (const stage of ["Patient Context", "History", "Examination", "Assessment", "Investigations", "Plan", "Review"]) assert.match(controller, new RegExp(`label: "${stage}"`), `canonical stage exists: ${stage}`);
for (const moduleName of ["complaint", "history", "examination", "impression", "prescription", "investigations", "ultrasound", "follow-up", "finish"]) assert.match(router, new RegExp(`"${moduleName}"`), `Classic module remains available: ${moduleName}`);
assert.match(router, /Search medication catalog first\./, "prescription flow retains explicit catalog-first empty guidance");
assert.match(router, /No saved prescription templates yet\./, "prescription template empty state remains explicit");
assert.match(cockpit, /InvestigationStationV3/, "Cockpit retains encounter-locked investigation workflow");
assert.match(careAssistPanel, /Run Care Assist Check/, "Care Assist can run inside the visit workflow");
for (const action of ["ACCEPT", "DISMISS", "SNOOZE", "RESOLVE"]) assert.match(decisionControls, new RegExp(action), `Care Assist decision remains available: ${action}`);
assert.match(doctorVisitController, /doctor-visit/, "doctor visit backend route exists");
assert.match(doctorVisitService, /doctor_visit\.started/, "visit start is audited");
assert.match(doctorVisitService, /doctor_visit\.packet_generated/, "packet generation is audited");
assert.match(doctorVisitService, /patientTask\.create/, "follow-up uses the patient task model");
assert.match(appModule, /DoctorVisitModule/, "doctor visit module is registered");

console.log("v0.12.4 doctor visit flow contract passed.");