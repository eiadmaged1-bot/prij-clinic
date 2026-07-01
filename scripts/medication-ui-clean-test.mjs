import { readFile } from "node:fs/promises";
import { makeRecorder } from "./security-route-manifest.mjs";

const record = makeRecorder("MED-UI-CLEAN");

const forbidden = [
  "Registration",
  "Official/source price",
  "Official listed price",
  "Source price",
  "Import run",
  "Parser confidence",
  "Official row fields",
  "Row preview",
  "official/source price",
  "how-to-take",
  "checkout",
  "purchase",
  "Pharmacy stock"
];

async function main() {
  const source = [
    await readFile("apps/web/components/medications/MedicationComponents.tsx", "utf8"),
    await readFile("apps/web/app/medications/page.tsx", "utf8"),
    await readFile("apps/web/app/drug-market/page.tsx", "utf8"),
    await readFile("apps/web/app/drug-market/products/[id]/page.tsx", "utf8"),
    await readFile("apps/web/app/admin/drug-market/review-queue/page.tsx", "utf8")
  ].join("\n");

  for (const label of forbidden) {
    if (source.toLowerCase().includes(label.toLowerCase())) throw new Error(`Medication UI still includes ${label}`);
  }
  record.pass("medication UI hides technical source, price, row, and commerce wording");

  for (const label of ["Verified", "Needs review", "Source-tracked", "Official data available", "Bahrain data", "Oman data", "Advanced source audit"]) {
    if (!source.includes(label)) throw new Error(`Medication UI missing simplified wording: ${label}`);
  }
  record.pass("medication UI keeps simplified trust language");
}

await main().catch((error) => record.fail("medication UI clean", error));
record.summary();
