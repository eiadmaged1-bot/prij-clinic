import { readFileSync } from "node:fs";

const failures = [];
const read = (file) => readFileSync(file, "utf8");

const medicationPage = read("apps/web/app/medications/page.tsx");
const medicationComponents = read("apps/web/components/medications/MedicationComponents.tsx");
const prescriptions = read("apps/web/app/prescriptions/page.tsx");
const patientPicker = read("apps/web/components/clinic/PatientPicker.tsx");

for (const text of ["Medication & Prescription Assistant", "Search & Prescribe", "painkiller", "vaginal infection"]) {
  if (!medicationPage.includes(text)) failures.push(`Medication page missing search-first marker: ${text}`);
}

for (const forbidden of ["Source tracked", "Import queue", "BHR / OMN / LBY", "benzodiazepine placeholder", "folic acid supplement class placeholder"]) {
  if (medicationPage.includes(forbidden)) failures.push(`Medication doctor page still exposes admin/placeholder text: ${forbidden}`);
}

if (!medicationComponents.includes("Review required")) failures.push("Medication cards must show review-required wording.");
if (/safe in pregnancy/i.test(medicationPage + medicationComponents)) failures.push("Medication UI must not say safe in pregnancy.");
if (!medicationComponents.includes("Add to prescription")) failures.push("Medication result cards need Add to prescription action.");
if (prescriptions.includes('apiGet("/patients")')) failures.push("Prescription builder must not preload all patients.");
if (!prescriptions.includes("Reference mode only. Select a patient")) failures.push("Prescription safety check must be limited without patient context.");
if (!patientPicker.includes("Include archived patients")) failures.push("Shared patient picker needs archived toggle.");
if (!patientPicker.includes("Obstetric / Pregnancy")) failures.push("Shared patient picker must group results by patient type.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("v1.4.2 doctor pharmacology contract passed.");
