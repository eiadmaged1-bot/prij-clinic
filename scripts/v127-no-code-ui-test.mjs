import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();

const scannedFiles = [
  "apps/web/app/login/page.tsx",
  "apps/web/app/patients/page.tsx",
  "apps/web/app/patients/new/page.tsx",
  "apps/web/app/patients/[id]/page.tsx",
  "apps/web/app/doctor/visit/page.tsx",
  "apps/web/app/prescriptions/page.tsx",
  "apps/web/app/medications/search/page.tsx",
  "apps/web/app/medications/safety/page.tsx",
  "apps/web/app/admin/medication-safety-profiles/page.tsx",
  "apps/web/components/care-assist/MedicationSafetyProfileSearch.tsx",
  "apps/web/components/medications/MedicationSafetyTerminal.tsx",
  "apps/web/components/medications/MedicationComponents.tsx"
];

const broadForbidden = [
  /raw JSON/i,
  /endpoint path/i,
  /\bPrisma\b/i,
  /schema\.prisma/i,
  /\bJWT\b/i,
  /stack trace/i,
  /\blocalhost\b/i,
  /API route/i,
  /developer label/i,
  /safe in pregnancy/i,
  /recommended drug/i,
  /best drug/i,
  /prescribe this/i,
  /dose suggestion/i,
  /category E/i
];

const clinicalReferenceForbidden = [
  /\bcart\b/i,
  /\bcheckout\b/i,
  /\bstock\b/i,
  /\bpurchase\b/i,
  /\bsales\b/i,
  /pharmacy inventory/i
];

const failures = [];

for (const file of scannedFiles) {
  const text = await readFile(join(root, file), "utf8");
  for (const pattern of broadForbidden) {
    if (pattern.test(text)) failures.push(`${file}: forbidden user-facing wording matched ${pattern}`);
  }

  if (!file.includes("/billing/") && !file.includes("\\billing\\")) {
    for (const pattern of clinicalReferenceForbidden) {
      if (pattern.test(text)) failures.push(`${file}: commerce wording matched ${pattern}`);
    }
  }
}

if (failures.length) {
  throw new Error(failures.join("\n"));
}

console.log(`V127-NO-CODE-UI PASS ${JSON.stringify({ scannedFiles: scannedFiles.length })}`);
