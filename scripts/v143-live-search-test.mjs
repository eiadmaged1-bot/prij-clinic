import { readFileSync } from "node:fs";

const checks = [
  ["Medication search debounces live input", "apps/web/components/medications/MedicationComponents.tsx", (text) => text.includes("window.setTimeout(() => void submit(), 250)") && text.includes("rankMedicationResults")],
  ["Drug family chips are buttons", "apps/web/components/medications/MedicationComponents.tsx", (text) => text.includes("clickable-chip") && text.includes("Use in medication search")],
  ["Drug market search is live", "apps/web/components/medications/MedicationComponents.tsx", (text) => (text.match(/window\.setTimeout\(\(\) => void submit\(\), 250\)/g) ?? []).length >= 2],
  ["Protocol atlas has compact view toggle", "apps/web/components/protocol-atlas/ProtocolAtlasBrowser.tsx", (text) => text.includes("Compact list") && text.includes("Open details")],
  ["Patient picker avoids native huge select", "apps/web/app/reception/check-in/page.tsx", (text) => text.includes("picker-row") && !text.includes("<select name=\"patientId\"")]
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
