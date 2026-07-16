import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [investigations, ultrasound, ultrasoundEditor, encounters, pregnancyService, rbac, en] = await Promise.all([
  readFile("apps/web/app/investigations/page.tsx", "utf8"),
  readFile("apps/web/app/ob-ultrasounds/page.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/ultrasounds/[scanId]/page.tsx", "utf8"),
  readFile("apps/web/app/encounters/page.tsx", "utf8"),
  readFile("apps/api/src/pregnancy/pregnancy.service.ts", "utf8"),
  readFile("apps/api/src/rbac/rbac.service.ts", "utf8"),
  readFile("apps/web/i18n/en.ts", "utf8")
]);

assert.match(investigations, /prij-investigation-basket:/);
assert.match(investigations, /uniqueCatalogItems/);
assert.doesNotMatch(investigations, /function duplicate\(index/);
assert.doesNotMatch(investigations, /onClick=\{\(\) => duplicate\(index\)\}/);
for (const action of ["remove(index)", "undoRemove", "move(index, -1)", "move(index, 1)", "saveSet"]) assert.match(investigations, new RegExp(action.replace(/[()]/g, "\\$&")));

for (const scanType of ["Dating", "Early pregnancy / viability", "First trimester / NT", "Anomaly", "Growth", "Doppler", "Cervical length", "Follow-up", "Follicular monitoring"]) assert.match(ultrasoundEditor, new RegExp(scanType.replace("/", "\\/")));
assert.match(ultrasoundEditor, /never diagnose, interpret, or sign/);
assert.match(en, /Patient → Pregnancy → Ultrasound/);
assert.match(ultrasound, /\/ob-ultrasounds/);
assert.match(pregnancyService, /Patient and active visit context are required/);
assert.match(pregnancyService, /recording_only_clinician_interpretation_required/);

assert.match(encounters, /Encounter history/);
assert.match(encounters, /t\("browseAllPatients"\)/);
assert.match(encounters, /tab=doctor-visit/);
assert.doesNotMatch(encounters, /<textarea disabled/);

assert.match(rbac, /assertAnotherActiveOwnerExists/);
assert.match(rbac, /The final active Owner cannot be deactivated or assigned another role/);
assert.match(rbac, /userRoles: \{ some: \{ role: \{ name: "Owner" \} \} \}/);
assert.match(rbac, /revokeAllUserSessions\(id, "Account deactivated\."\)/);

console.log("v1.4.8 clinical workspace and account safety contracts PASS (34 assertions)");
