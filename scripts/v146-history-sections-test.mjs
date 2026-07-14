import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [history, css] = await Promise.all([
  readFile("apps/web/app/patients/[id]/panel-components.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const section of ["Presenting complaint", "Obstetric history", "Menstrual history", "Gynecologic history", "Medical and surgical history", "Medication and allergy history", "Social history", "Previous investigations"]) {
  assert.ok(history.includes(`title="${section}"`), `collapsed history section missing: ${section}`);
}
assert.match(history, /Quick Add · Optional Key Details · Optional Full Details/, "progressive disclosure labels missing");
for (const field of ["gravida", "para", "abortions", "livingChildren", "lmp", "cycleInterval", "duration", "bleedingAmount", "menopauseStatus", "dysmenorrhea", "dyspareunia"]) assert.ok(history.includes(`name="${field}"`), `structured history field missing: ${field}`);
assert.match(history, /function TriStateField/, "yes/no/unknown control missing");
assert.match(history, /History summary/, "final history review summary missing");
assert.match(history, /SelectedBasket title="Selected history"/, "history actions must retain the unified save-once basket");
assert.match(css, /\.history-collapsed-section/, "collapsed section design missing");
assert.match(css, /\.history-review-bar[\s\S]*position: sticky/, "mobile history review/save action must remain visible");

console.log("v1.4.6 collapsed structured history workflow PASS (24 assertions)");
