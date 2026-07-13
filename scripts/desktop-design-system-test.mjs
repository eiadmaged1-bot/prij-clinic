import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [components, css, doctor, shell] = await Promise.all([
  readFile("apps/web/components/clinic/desktop-ui.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8"),
  readFile("apps/web/app/doctor/page.tsx", "utf8"),
  readFile("apps/web/app/mvp-page.tsx", "utf8")
]);

for (const component of ["PageShell", "PageHeader", "CompactKpiCard", "SectionCard", "Tabs", "SegmentedControl", "EmptyState", "PatientIdentityBar", "ClinicalTagCard", "FilterDrawer", "ActionToolbar", "SplitPane", "Stepper", "DataTable"]) {
  assert(components.includes(`function ${component}`), `missing shared ${component}`);
}
assert(shell.includes("export function UserMenu"), "shared shell must expose the compact UserMenu");
for (const token of ["--space-1: 4px", "--space-2: 8px", "--space-3: 12px", "--space-4: 16px", "--space-6: 24px", "--space-8: 32px"]) {
  assert(css.includes(token), `missing spacing token ${token}`);
}
assert(css.includes("repeat(12, minmax(0, 1fr))") && css.includes("1600px"), "desktop shell must use a bounded 12-column grid");
assert(css.includes("min-height: 104px") && css.includes("--density-sidebar-width: 16rem"), "KPI and sidebar dimensions must remain compact");
for (const action of ["Open next patient", "Find patient", "Start new visit"]) assert(doctor.includes(action), `doctor action missing: ${action}`);
assert(!doctor.includes("Today&apos;s visits, made simple"), "doctor dashboard must not use a marketing hero");

console.log("Luxurious symmetrical desktop design system PASS");
