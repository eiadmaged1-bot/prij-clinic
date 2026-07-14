import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, css] = await Promise.all([
  readFile(new URL("../apps/web/app/doctor/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
]);

for (const label of ["Open next patient", "Find patient", "Resume active visit", 'label="Waiting"', 'label="Appointments"', 'label="Results"', 'label="Follow-ups"', "Current patient / active visit", "Waiting patients", "Recent activity"]) assert.ok(page.includes(label));
assert.equal((page.match(/<CompactKpiCard/g) ?? []).length, 4);
assert.match(page, /Array\.from\(\{ length: 4 \}/);
assert.match(css, /doctor-kpi-grid[\s\S]*grid-template-columns: repeat\(2/);
assert.match(css, /doctor-kpi-grid \.compact-kpi-card[\s\S]*min-height: 6rem/);
assert.match(css, /\.topbar \{[\s\S]*position: sticky/);

console.log("v1.4.5 compact Doctor mobile dashboard: 16 assertions passed");
