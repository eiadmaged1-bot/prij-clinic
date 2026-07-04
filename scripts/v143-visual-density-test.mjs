import { readFileSync } from "node:fs";

const checks = [
  ["New Patient hides Sex field", "apps/web/app/patients/new/page.tsx", (text) => !/>\s*Sex\s*<|<option value=\"male\"/i.test(text) && text.includes('sex: "female"')],
  ["Sexual activity is under sensitive details", "apps/web/app/patients/new/page.tsx", (text) => text.includes("Sensitive clinical details") && text.includes("Not sexually active / Virgin")],
  ["Sidebar has collapse drawer controls", "apps/web/app/mvp-page.tsx", (text) => text.includes("prijSidebarCollapsed") && text.includes("toggleNavigation")],
  ["Calendar metrics use compact metric class", "apps/web/app/clinic-operations-page.tsx", (text) => text.includes("compact-metric-grid") && text.includes("mini-metric-card")],
  ["Operations loop uses compact pipeline", "apps/web/app/clinic-operations-page.tsx", (text) => text.includes("operation-pipeline") && !text.includes("<span>Scheduled</span><span>Checked in</span>")],
  ["Check-in page uses compact wizard", "apps/web/app/reception/check-in/page.tsx", (text) => text.includes("check-in-wizard") && text.includes("wizard-steps") && !text.includes("<select name=\"patientId\"")],
  ["Patient action drawers are present", "apps/web/app/patients/[id]/page.tsx", (text) => text.includes("PatientActionPanel") && text.includes("SelectedPatientSummary")],
  ["Patient summary recent activity is compact", "apps/web/app/patients/[id]/page.tsx", (text) => text.includes("No urgent activity") && text.includes("dense-card-list")],
  ["Protocol badges do not break words", "apps/web/app/globals.css", (text) => text.includes(".protocol-status") && text.includes("white-space: nowrap")],
  ["Workflow help is collapsed by default", "apps/web/app/mvp-page.tsx", (text) => text.includes("collapsible-help-panel") && text.includes("<summary>How this works</summary>")]
];

let failed = 0;
for (const [name, file, test] of checks) {
  const text = readFileSync(file, "utf8");
  if (test(text)) console.log(`PASS ${name}`);
  else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

if (failed) process.exit(1);
