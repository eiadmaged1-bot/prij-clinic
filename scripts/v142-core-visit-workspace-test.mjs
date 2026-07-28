import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [workspace, controller, cockpit, identity] = await Promise.all([
  readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8"),
  readFile("apps/web/components/clinic/SharedEncounterWorkspaceController.tsx", "utf8"),
  readFile("apps/web/components/clinic/VisitCockpitWorkspace.tsx", "utf8"),
  readFile("apps/web/components/clinic/PatientVisitIdentityBar.tsx", "utf8")
]);

assert.match(workspace, /PatientVisitIdentityBar/, "Classic keeps the locked patient identity bar");
assert.match(identity, /data-locked-patient-bar/, "identity bar keeps its stable safety contract");
for (const moduleName of ["complaint", "history", "examination", "impression", "prescription", "investigations", "ultrasound", "follow-up", "finish"]) assert.match(workspace, new RegExp(`"${moduleName}"`), `Classic module remains available: ${moduleName}`);
assert.equal((workspace.match(/useSharedEncounterWorkspaceController\(/g) ?? []).length, 1, "workspace creates one shared controller");
assert.match(workspace, /controller\.save\(\)/, "Classic saves through the shared controller");
assert.match(workspace, /controller\.finish\(\)/, "Classic signs through the shared Review gateway");
assert.doesNotMatch(workspace, />Finish visit<|>Finish and print</, "no direct completion bypass remains");
assert.match(controller, /"saving".*"saved".*"failed".*"offline".*"waiting-sync".*"conflict"/s, "controller models critical persistence states");
assert.match(cockpit, /role="tablist"/, "Cockpit stages expose tab semantics");
for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) assert.match(cockpit, new RegExp(`event\\.key === "${key}"`), `Cockpit supports ${key}`);
assert.doesNotMatch(workspace, /PatientPicker/, "active visit cannot change patient context");

console.log("v1.4.2 core visit workspace contract passed.");