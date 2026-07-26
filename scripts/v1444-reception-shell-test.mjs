import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
const css = await readFile("apps/web/app/globals.css", "utf8");
const reception = await readFile("apps/web/app/reception/page.tsx", "utf8");
const copy = await readFile("apps/web/app/reception/reception-copy.ts", "utf8");

assert.match(shell, /isReceptionistOnly \? \[\] : buildShellNavGroups/);
assert.match(shell, /user && !isReceptionistOnly[\s\S]*?aria-label="Close navigation"/);
assert.match(shell, /isReceptionistOnly \? "receptionist-shell no-sidebar"/);
assert.match(shell, /!isReceptionistOnly \? <UniversalSearchBox \/> : null/);
assert.match(shell, /receptionist-topbar-actions/);
assert.match(shell, /href="\/reception"[\s\S]*?LanguageSwitcher[\s\S]*?signOut\(\)/);
assert.doesNotMatch(shell, /interfaceMode === "MINIMALISTIC" && \(isDoctorOnly \|\| isReceptionistOnly\)/);
assert.match(css, /\.app-shell\.receptionist-shell\.no-sidebar[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
assert.match(css, /\.reception-primary-actions[\s\S]*?repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.reception-primary-actions[\s\S]*?minmax\(0, 1fr\)/);
for (const action of ["New Patient", "Returning Patient", "Waiting Line", "Next to doctor"]) {
  assert.ok(copy.includes(action), "Reception bilingual copy must expose " + action);
}
for (const route of ["/patients/new", "/reception/check-in", "/queue"]) {
  assert.ok(reception.includes(route), "Reception workspace must expose route " + route);
}
for (const forbidden of ["Doctor view", "New Encounter", "New Prescription", "Owner Control"]) {
  assert.equal(reception.includes(forbidden), false, "Reception workspace must not expose " + forbidden);
}
assert.match(reception, /data-next-to-doctor/);
assert.match(reception, /ticket\.status === "in_room"[\s\S]*?ticket\.status === "called"/);
assert.match(copy, /No patient with doctor/);
console.log("v1.4.4 receptionist single-workspace isolation PASS");
