import { readFile } from "node:fs/promises";

const files = [
  "apps/web/app/patients/[id]/page.tsx",
  "apps/web/app/clinic-operations-page.tsx",
  "apps/api/src/pregnancy/pregnancy.service.ts",
  "apps/api/src/pregnancy/dto.ts"
];
const forbidden = [
  "automatic FGR diagnosis",
  "automatic anomaly diagnosis",
  "automatic diagnosis",
  "automatic prescribing",
  "automatic dosing",
  "treatment ranking",
  "fetal image AI",
  "safe in pregnancy",
  "recommended dose",
  "best treatment",
  "prescribe this",
  "DICOM",
  "PACS",
  "WhatsApp",
  "insurance"
];
const checks = [];
const failures = [];

const text = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n").toLowerCase();
for (const phrase of forbidden) {
  if (text.includes(phrase.toLowerCase())) failures.push(`forbidden OB/GYN automation wording found: ${phrase}`);
}
for (const required of ["doctor interpretation remains required", "does not diagnose growth", "interpretation must be completed by the doctor", "recording_only_clinician_interpretation_required"]) {
  if (!text.includes(required.toLowerCase())) failures.push(`missing safety wording: ${required}`);
}
checks.push("OB/GYN surfaces avoid diagnosis, prescribing, dosing, FGR, anomaly, image AI, DICOM, insurance, and external messaging automation");

if (failures.length) throw new Error(failures.join("\n"));
console.log(`V14-NO-UNSAFE-OBGYN-AUTOMATION PASS ${JSON.stringify({ checks })}`);
