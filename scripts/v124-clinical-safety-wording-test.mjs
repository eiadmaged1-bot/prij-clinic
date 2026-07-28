import { readFileSync } from "node:fs";
import { join } from "node:path";

const checkedFiles = [
"apps/web/app/patients/[id]/page.tsx",
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  "apps/web/components/medications/MedicationSafetyTerminal.tsx",
  "apps/web/components/care-assist/MedicationSafetyProfileSearch.tsx",
  "apps/web/components/medications/PregnancyLactationSafetyProfile.tsx",
  "apps/api/src/care-assist/medication-pregnancy-lactation-safety.service.ts",
  "apps/api/src/doctor-visit/doctor-visit.service.ts"
];

const forbiddenPhrases = [
  "best drug",
  "recommended drug",
  "safe in pregnancy",
  "use this drug",
  "prescribe this",
  "dose suggestion",
  "frequency suggestion",
  "treatment ranking",
  "automatic treatment",
  "AI doctor",
  "up to date today"
];

const forbiddenReferenceWords = ["cart", "checkout", "buy", "stock", "availability", "supplier", "purchase", "sales", "pharmacy inventory"];
const root = process.cwd();

for (const file of checkedFiles) {
  const source = readFileSync(join(root, file), "utf8");
  const lower = source.toLowerCase();
  for (const phrase of forbiddenPhrases) {
    if (lower.includes(phrase.toLowerCase())) {
      throw new Error(`${file} contains forbidden clinical wording: ${phrase}`);
    }
  }
  for (const word of forbiddenReferenceWords) {
    if (lower.includes(word) && !isAllowedBoundary(source, word)) {
      throw new Error(`${file} contains forbidden pharmacy/sales wording: ${word}`);
    }
  }
}

const schema = readFileSync(join(root, "apps/api/prisma/schema.prisma"), "utf8");
if (/enum\s+LegacyPregnancyCategory[\s\S]*\bE\b/.test(schema)) {
  throw new Error("LegacyPregnancyCategory must not accept category E.");
}

const patientPage = `${readFileSync(join(root, "apps/web/app/patients/[id]/page.tsx"), "utf8")}\n${readFileSync(join(root, "apps/web/components/clinic/ActiveVisitWorkspace.tsx"), "utf8")}`;
if (!patientPage.includes("genericName")) throw new Error("Generic medication name must stay visible in prescription workflow.");
if (!patientPage.includes("Dose, frequency, and duration are not auto-filled.")) throw new Error("Prescription flow must state no default dosing automation.");

const terminal = readFileSync(join(root, "apps/web/components/medications/MedicationSafetyTerminal.tsx"), "utf8");
if (!terminal.includes("Last checked") || !terminal.includes("unknown")) throw new Error("Safety terminal must show unknown last checked state.");
if (!terminal.includes("Review required")) throw new Error("Safety terminal must show review required for unreviewed profiles.");

console.log("v0.12.4 clinical safety wording checks passed.");

function isAllowedBoundary(source, word) {
  return source
    .split(/\r?\n/)
    .filter((line) => line.toLowerCase().includes(word))
    .every((line) => /forbidden|must not|do not|not contain|negative|boundary/i.test(line));
}
