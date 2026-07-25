import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const overview = fs.readFileSync(path.join(root, "apps/web/app/patients/[id]/patient-components.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "apps/web/app/globals.css"), "utf8");

for (const contract of [
  "compact-context-calendar",
  "context-calendar-toolbar",
  "calendar-day-number",
  "calendar-event-overflow",
  "dayEvents.slice(0, 2)",
  "dayEvents.length - 2",
  "Go to current month",
  "reproductive-history-card",
  "history-context-filter",
  "EDD provenance",
  "Correction history",
  "Source and provenance",
  '"pregnancy"',
  '"menopause"'
]) {
  assert.match(overview, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Patient Overview must implement ${contract}`);
}

assert.match(overview, /snapshot\.context !== "pregnancy" && snapshot\.lmp/, "pregnancy history must not calculate an ordinary active cycle day");
assert.match(overview, /Pregnancy dating LMP/, "pregnancy LMP must remain a dating/history event instead of active menstruation");
assert.match(overview, /Pregnancy bleeding/, "pregnancy-specific bleeding must remain visible in history");
assert.match(overview, /filteredSnapshots/, "history filters must use a readable precomputed filtered set");
assert.doesNotMatch(overview, /const filtered = snapshots\.filter\(\(snapshot\) => filter === "all" \|\| filter === "abnormal" \?/, "the dense ambiguous history-filter ternary must be removed");

assert.match(css, /\.compact-context-calendar\s*\{[\s\S]*?max-width:\s*760px/, "desktop calendar width must be capped");
assert.match(css, /\.context-calendar-day\s*\{[\s\S]*?min-height:\s*38px/, "desktop calendar cells must be compact");
assert.match(css, /\.calendar-event\s*\{[\s\S]*?font-size:\s*9px/, "calendar event labels must be compact");
assert.match(css, /\.calendar-event-overflow\s*\{/, "calendar overflow count must be styled");
assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.context-calendar-day\s*\{[^}]*min-height:\s*34px/, "mobile calendar cells must be smaller without losing the seven-column grid");
assert.match(css, /\.reproductive-history-card\s*\{/, "history records must use compact cards");
assert.match(css, /\.history-edd-provenance\s*\{/, "EDD provenance summary must have a dedicated compact layout");
assert.match(css, /\.reproductive-history-details\s*>\s*summary/, "source/provenance details must be collapsible");

console.log("Compact context calendar and reproductive History contract PASS");
