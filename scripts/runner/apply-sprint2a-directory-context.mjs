import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const write = (file, content) => fs.writeFileSync(file, content, "utf8");

function replaceOnce(file, before, after) {
  const source = read(file);
  if (!source.includes(before)) throw new Error(`${file}: expected source contract not found`);
  const next = source.replace(before, after);
  if (next === source) throw new Error(`${file}: replacement did not change source`);
  write(file, next);
}

const labelsFile = "apps/web/lib/patient-labels.ts";
if (read(labelsFile).includes('HIGH_RISK_OBSTETRIC: "OBSTETRIC"')) {
  console.log("Sprint 2A directory context normalization already applied.");
  process.exit(0);
}

replaceOnce(
  labelsFile,
  `export const patientTypeOptions: Array<{ value: CanonicalPatientType; label: string; labelAr: string }> = [
  { value: "OBSTETRIC", label: "Obstetric / Pregnancy", labelAr: "حمل ومتابعة ولادة" },
  { value: "HIGH_RISK_OBSTETRIC", label: "High-risk obstetric", labelAr: "حمل عالي الخطورة" },
  { value: "GYNECOLOGY", label: "Gynecology", labelAr: "أمراض النساء" },
  { value: "INFERTILITY", label: "Infertility / Fertility", labelAr: "تأخر الإنجاب والخصوبة" },
  { value: "POSTPARTUM", label: "Postpartum", labelAr: "ما بعد الولادة" },
  { value: "PREVENTIVE_WELL_WOMAN", label: "Preventive / Well-woman", labelAr: "صحة المرأة والوقاية" },
  { value: "OTHER", label: "Other", labelAr: "أخرى" }
];`,
  `export const patientTypeOptions: Array<{ value: CanonicalPatientType; label: string; labelAr: string }> = [
  { value: "OBSTETRIC", label: "Pregnancy / Obstetric", labelAr: "الحمل / التوليد" },
  { value: "GYNECOLOGY", label: "Gynecology", labelAr: "أمراض النساء" },
  { value: "INFERTILITY", label: "Fertility", labelAr: "الخصوبة" },
  { value: "OTHER", label: "Undetermined", labelAr: "غير محدد بعد" }
];`
);

replaceOnce(
  labelsFile,
  `const legacyPatientTypeMap: Record<string, CanonicalPatientType> = {
  OB: "OBSTETRIC",
  PREGNANCY: "OBSTETRIC",
  GYN: "GYNECOLOGY",
  WOMEN_HEALTH: "PREVENTIVE_WELL_WOMAN",
  FERTILITY: "INFERTILITY",
  GENERAL: "OTHER"
};`,
  `const legacyPatientTypeMap: Record<string, CanonicalPatientType> = {
  OB: "OBSTETRIC",
  PREGNANCY: "OBSTETRIC",
  HIGH_RISK_OBSTETRIC: "OBSTETRIC",
  POSTPARTUM: "OBSTETRIC",
  GYN: "GYNECOLOGY",
  WOMEN_HEALTH: "GYNECOLOGY",
  PREVENTIVE_WELL_WOMAN: "GYNECOLOGY",
  FERTILITY: "INFERTILITY",
  GENERAL: "OTHER"
};`
);

const searchServiceFile = "apps/api/src/patients/services/patient-search.service.ts";
replaceOnce(
  searchServiceFile,
  `    const requestedType = isPatientType(options.patientType) ? options.patientType : undefined;`,
  `    const requestedTypes = patientTypeFilter(options.patientType);`
);
replaceOnce(
  searchServiceFile,
  `      ...(requestedType ? { patientType: requestedType } : {}),`,
  `      ...(requestedTypes?.length ? { patientType: { in: requestedTypes } } : {}),`
);
replaceOnce(
  searchServiceFile,
  `function isPatientType(value?: string): value is PatientType {
  return Boolean(value && Object.values(PatientType).includes(value as PatientType));
}`,
  `function patientTypeFilter(value?: string): PatientType[] | undefined {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "OBSTETRIC") return [PatientType.OBSTETRIC, PatientType.HIGH_RISK_OBSTETRIC, PatientType.POSTPARTUM, PatientType.OB];
  if (normalized === "GYNECOLOGY") return [PatientType.GYNECOLOGY, PatientType.GYN, PatientType.PREVENTIVE_WELL_WOMAN, PatientType.WOMEN_HEALTH];
  if (normalized === "INFERTILITY") return [PatientType.INFERTILITY];
  if (normalized === "OTHER") return [PatientType.OTHER, PatientType.GENERAL];
  return undefined;
}`
);

const directoryFile = "apps/web/app/patients/page.tsx";
replaceOnce(
  directoryFile,
  `import { ageLabel, patientTypeOptions, phaseTypeLabel } from "@/lib/patient-labels";`,
  `import { ageLabel, patientTypeLabel, patientTypeOptions, phaseTypeLabel } from "@/lib/patient-labels";`
);
replaceOnce(
  directoryFile,
  `function patientTypeDisplay(value: string | null | undefined, language: "en" | "ar") {
  const normalized = String(value ?? "OTHER").toUpperCase();
  const canonical = ["OB", "PREGNANCY"].includes(normalized) ? "OBSTETRIC" : ["GYN", "WOMEN_HEALTH"].includes(normalized) ? "GYNECOLOGY" : normalized === "FERTILITY" ? "INFERTILITY" : normalized;
  const labels: Record<string, [string, string]> = {
    OBSTETRIC: ["Obstetric", "حمل وولادة"], HIGH_RISK_OBSTETRIC: ["High-risk obstetric", "حمل عالي الخطورة"], GYNECOLOGY: ["Gynecology", "أمراض النساء"], INFERTILITY: ["Infertility", "تأخر الإنجاب"], POSTPARTUM: ["Postpartum", "ما بعد الولادة"], PREVENTIVE_WELL_WOMAN: ["Preventive", "رعاية وقائية"], OTHER: ["Other", "أخرى"], GENERAL: ["Other", "أخرى"]
  };
  return (labels[canonical] ?? labels.OTHER)![language === "ar" ? 1 : 0];
}`,
  `function patientTypeDisplay(value: string | null | undefined, language: "en" | "ar") {
  return patientTypeLabel(value, language);
}`
);

const testFile = "scripts/sprint2a-patient-foundation-test.mjs";
let test = read(testFile);
test = test.replace(
  `const lookup = read("apps/api/src/patients/services/patient-lookup.service.ts");`,
  `const lookup = read("apps/api/src/patients/services/patient-lookup.service.ts");
const directoryApi = read("apps/api/src/patients/services/patient-search.service.ts");
const directory = read("apps/web/app/patients/page.tsx");`
);
test = test.replace(
  `const creationOptions = labels.slice(labels.indexOf("export const patientCreationContextOptions"), labels.indexOf("const legacyPatientTypeMap"));
rejectAll(creationOptions, "creation contexts", ["HIGH_RISK_OBSTETRIC", "POSTPARTUM", "PREVENTIVE_WELL_WOMAN"]);`,
  `const directoryOptions = labels.slice(labels.indexOf("export const patientTypeOptions"), labels.indexOf("export type PatientCreationContext"));
const creationOptions = labels.slice(labels.indexOf("export const patientCreationContextOptions"), labels.indexOf("const legacyPatientTypeMap"));
rejectAll(directoryOptions, "directory contexts", ["HIGH_RISK_OBSTETRIC", "POSTPARTUM", "PREVENTIVE_WELL_WOMAN"]);
rejectAll(creationOptions, "creation contexts", ["HIGH_RISK_OBSTETRIC", "POSTPARTUM", "PREVENTIVE_WELL_WOMAN"]);
requireAll(labels, "legacy context normalization", [
  'HIGH_RISK_OBSTETRIC: "OBSTETRIC"',
  'POSTPARTUM: "OBSTETRIC"',
  'PREVENTIVE_WELL_WOMAN: "GYNECOLOGY"',
  'WOMEN_HEALTH: "GYNECOLOGY"'
]);`
);
test = test.replace(
  `requireAll(shared, "shared patient summary", ["yearOfBirth: number | null"]);`,
  `requireAll(directoryApi, "grouped directory context filters", [
  "patientTypeFilter(options.patientType)",
  "PatientType.HIGH_RISK_OBSTETRIC",
  "PatientType.POSTPARTUM",
  "PatientType.PREVENTIVE_WELL_WOMAN"
]);
requireAll(directory, "directory base context labels", [
  "patientTypeLabel(value, language)"
]);
rejectAll(directory, "directory base context labels", ['HIGH_RISK_OBSTETRIC: ["High-risk obstetric"', 'POSTPARTUM: ["Postpartum"']);
requireAll(shared, "shared patient summary", ["yearOfBirth: number | null"]);`
);
write(testFile, test);

const evidenceFile = "docs/verification/SPRINT2A_PATIENT_FOUNDATION_RESULT.md";
let evidence = read(evidenceFile);
evidence = evidence.replace(
  `- Selected patient context remains available to the clinical workspace.`,
  `- Selected patient context remains available to the clinical workspace.
- Patient directory filters now use grouped base contexts, so legacy high-risk and postpartum records remain discoverable under Pregnancy / Obstetric without presenting them as patient types.
- Legacy Preventive / Well-woman records are presented under the Gynecology base context until episode-level phase work is completed.`
);
write(evidenceFile, evidence);

console.log("Sprint 2A directory context normalization applied.");
