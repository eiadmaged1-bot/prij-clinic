import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const requireAll = (source, label, needles) => {
  for (const needle of needles) if (!source.includes(needle)) throw new Error(label + " missing: " + needle);
};
const rejectAll = (source, label, needles) => {
  for (const needle of needles) if (source.includes(needle)) throw new Error(label + " still contains forbidden contract: " + needle);
};

const form = read("apps/web/app/patients/new/page.tsx");
const labels = read("apps/web/lib/patient-labels.ts");
const lookup = read("apps/api/src/patients/services/patient-lookup.service.ts");
const directoryApi = read("apps/api/src/patients/services/patient-search.service.ts");
const directory = read("apps/web/app/patients/page.tsx");
const page = read("apps/web/app/patients/[id]/page.tsx");
const identity = read("apps/web/components/patients/PatientSmartIdentityBar.tsx");
const patientComponents = read("apps/web/app/patients/[id]/patient-components.tsx");
const shared = read("packages/shared/src/index.ts");

requireAll(form, "patient creation", [
  'patientType: "OBSTETRIC"',
  "patientCreationContextOptions",
  'creationEndpoint = saveIntent === "open" ? "/patients/create-and-start-visit" : "/patients"',
  "patientCreateErrorMessage",
  "copy.invalidCareContext",
  "copy.invalidYearOfBirth",
  "copy.duplicateReviewRequired",
  "Create patient and start visit"
]);
rejectAll(form, "patient creation", ['patientType: "WOMEN_HEALTH"', 'form.patientType || "WOMEN_HEALTH"', "patientTypeOptions.map"]);

requireAll(labels, "creation contexts", [
  'export type PatientCreationContext = "OBSTETRIC" | "GYNECOLOGY" | "INFERTILITY" | "OTHER"',
  'label: "Pregnancy / Obstetric"',
  'label: "Fertility"',
  'label: "Undetermined"',
  "ageLabel(dateOfBirth?: string | null, yearOfBirth?: number | string | null)"
]);
const directoryOptions = labels.slice(labels.indexOf("export const patientTypeOptions"), labels.indexOf("export type PatientCreationContext"));
const creationOptions = labels.slice(labels.indexOf("export const patientCreationContextOptions"), labels.indexOf("const legacyPatientTypeMap"));
rejectAll(directoryOptions, "directory contexts", ["HIGH_RISK_OBSTETRIC", "POSTPARTUM", "PREVENTIVE_WELL_WOMAN"]);
rejectAll(creationOptions, "creation contexts", ["HIGH_RISK_OBSTETRIC", "POSTPARTUM", "PREVENTIVE_WELL_WOMAN"]);
requireAll(labels, "legacy context normalization", [
  'HIGH_RISK_OBSTETRIC: "OBSTETRIC"',
  'POSTPARTUM: "OBSTETRIC"',
  'PREVENTIVE_WELL_WOMAN: "GYNECOLOGY"',
  'WOMEN_HEALTH: "GYNECOLOGY"'
]);

requireAll(lookup, "workspace age persistence", [
  "yearOfBirth: true",
  "yearOfBirth: patient.yearOfBirth",
  "ageSummary(patient.dateOfBirth, patient.yearOfBirth, now)",
  "function ageSummary(date: Date | null, yearOfBirth: number | null, now: Date)"
]);
requireAll(directoryApi, "grouped directory context filters", [
  "patientTypeFilter(options.patientType)",
  "PatientType.HIGH_RISK_OBSTETRIC",
  "PatientType.POSTPARTUM",
  "PatientType.PREVENTIVE_WELL_WOMAN"
]);
requireAll(directory, "directory base context labels", [
  "patientTypeLabel(value, language)"
]);
rejectAll(directory, "directory base context labels", ['HIGH_RISK_OBSTETRIC: ["High-risk obstetric"', 'POSTPARTUM: ["Postpartum"']);
requireAll(shared, "shared patient summary", ["yearOfBirth: number | null"]);
requireAll(patientComponents, "patient model", ["yearOfBirth?: number | null"]);
requireAll(page, "patient page", ["yearOfBirth: summary.patient.yearOfBirth", "patientAgeLabel(patient?.dateOfBirth, patient?.yearOfBirth)"]);
requireAll(identity, "identity bar", ["ageLabel(patient.dateOfBirth, patient.yearOfBirth)"]);

console.log("Sprint 2A patient foundation contract PASS");
