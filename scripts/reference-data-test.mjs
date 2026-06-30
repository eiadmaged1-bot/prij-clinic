import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const seed = await readFile("apps/api/prisma/seed.js", "utf8");
const dashboard = await readFile("apps/web/app/admin/reference-data/page.tsx", "utf8");
const docs = await readFile("docs/MEDICAL_REFERENCE_SOURCE_POLICY.md", "utf8");

for (const token of ["guidelineSources", "seedMedicationIntelligence", "drugMarketCountry", "drugMarketSource", "medicationDataSource", "drugMarketSourceConnector"]) {
  assert(seed.includes(token), `reference bootstrap missing ${token}`);
}

for (const label of ["Medication terminology", "Drug labels", "Herbs", "Egypt/Gulf drug market", "Guidelines", "Protocol Atlas", "Calculators/Formulas"]) {
  assert(dashboard.includes(label), `reference dashboard missing ${label}`);
}

for (const rule of ["No autonomous diagnosis", "No autonomous prescribing", "No self-medication guidance", "market metadata only"]) {
  assert(docs.includes(rule), `source policy missing rule: ${rule}`);
}

console.log("REFERENCE-DATA PASS");
