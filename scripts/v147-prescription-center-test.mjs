import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, dto, service, css] = await Promise.all([
  readFile("apps/web/app/prescriptions/page.tsx", "utf8"),
  readFile("apps/api/src/prescriptions/dto.ts", "utf8"),
  readFile("apps/api/src/prescriptions/prescriptions.service.ts", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const tab of ["Templates", "Saved meds", "Recent"]) assert.match(page, new RegExp(`"${tab}"`));
assert.match(page, /prescription-tabs/);
assert.match(css, /\.prescription-tabs[\s\S]*overflow-x: auto/);
assert.match(page, /Undo remove/);
assert.match(page, /Personal template/);
assert.match(page, /Clinic template \(Owner\/Admin only\)/);
assert.match(dto, /templateScope\?: "personal" \| "clinic"/);
assert.match(service, /Only Owner or Admin can create clinic templates/);
assert.match(service, /ownerUserId: clinicTemplate \? null : user\.id/);
assert.match(page, /lockedContext \? \[/);
assert.match(page, /Clinical prescriptions can only be created from a selected patient and active visit/);
for (const field of ["strengthText", "dosageForm", "doseUnit", "route", "frequency", "duration", "prn", "instructions"]) assert.ok(page.includes(field));

console.log("v1.4.7 patient-centered prescription management PASS (20 assertions)");
