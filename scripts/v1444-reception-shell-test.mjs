import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
const css = await readFile("apps/web/app/globals.css", "utf8");
const reception = await readFile("apps/web/app/reception/page.tsx", "utf8");
const navigation = await readFile("apps/web/app/navigation-registry.ts", "utf8");

assert.match(shell, /useState\(false\).*mobileNavOpen/s, "mobile drawer must initialize closed");
assert.match(shell, /setMobileNavOpen\(false\);\s*}\, \[pathname\]/, "mobile drawer must close after route selection");
assert.equal(shell.includes('isReceptionistOnly ? "no-sidebar receptionist-shell"'), false, "desktop receptionist content must not be pushed below a rendered sidebar");
assert.match(shell, /isReceptionistOnly \? "receptionist-shell"/, "receptionist shell must keep a desktop sidebar");
assert.match(shell, /isReceptionistOnly \? false : localStorage\.getItem\("prijSidebarCollapsed"\)/, "persisted collapsed state must not break the receptionist desktop shell");
assert.match(css, /\.app-shell\.receptionist-shell\s*{\s*--density-sidebar-width: 14\.5rem;/, "receptionist desktop sidebar must be compact");
assert.match(css, /@media \(max-width: 1199px\)[\s\S]*?\.sidebar\s*{[\s\S]*?position: fixed;[\s\S]*?transform: translateX/, "mobile navigation must be an off-canvas drawer");
assert.match(css, /\.reception-home-grid\s*{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, "desktop actions must use a symmetrical grid");
assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.reception-home-grid[\s\S]*?grid-template-columns: 1fr;/, "mobile actions must collapse without horizontal overflow");

for (const action of ["Search patient", "New Patient", "Returning Patient / QR", "Check-in", "Today’s appointments", "Book appointment", "Queue now"]) {
  assert.ok(reception.includes(action), `reception dashboard must expose ${action}`);
}
for (const forbidden of ["New Encounter", "New Prescription", "Owner Control"]) {
  assert.equal(reception.includes(forbidden), false, `reception dashboard must not expose ${forbidden}`);
}
assert.match(reception, /user\?\.permissions\.includes\("billing\.read"\)/, "payment status must be permission-gated");
assert.match(shell, /if \(isReceptionistOnly\)[\s\S]*?title: "Reception", href: "\/reception"[\s\S]*?title: "New Patient"/, "reception navigation must be a flat role-specific list");
assert.equal((navigation.match(/href: "\/reception", label: "Home"/g) ?? []).length, 1, "navigation registry must have one receptionist home route");

console.log("v1.4.4 receptionist shell/workflow: 22 assertions passed");
