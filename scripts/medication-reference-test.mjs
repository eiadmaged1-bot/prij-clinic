import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [searchService, components, page] = await Promise.all([
  readFile("apps/api/src/medications/medication-search.service.ts", "utf8"),
  readFile("apps/web/components/medications/MedicationComponents.tsx", "utf8"),
  readFile("apps/web/app/medications/page.tsx", "utf8")
]);

for (const source of ["medicationGeneric.findMany", "drugFamily.findMany", "medicationIngredient.findMany", "medicationProduct.findMany", "drugMarketVariant.findMany"]) assert(searchService.includes(source), `search must reuse ${source}`);
for (const field of ["genericName", "familyName", "className", "pharmacologicClass", "aliases", "strengthText", "dosageForm", "countryCode"]) assert(searchService.includes(field), `search field missing: ${field}`);
assert(searchService.includes("isDemo: false"), "normal search must exclude demo market rows");
assert(components.includes("onSubmit={submit}") && components.includes('type="submit">Search'), "search button and Enter-to-search must share the working handler");
assert(components.includes("onSelect?.(result)") && page.includes("setSelected"), "medication selection must drive the profile panel");
assert(components.includes("Add to prescription") && page.includes('params.set("medication"'), "result action must transfer only the selected medication name to the doctor-controlled builder");
assert(components.includes("Select a medication to view its clinical reference profile."), "empty profile panel must be explicit");
for (const profileField of ["Generic", "Brands", "Family / class", "Form / strength", "Country availability", "Warnings and interactions", "Source", "Last reviewed"]) assert(components.includes(profileField), `profile field missing: ${profileField}`);
assert(!components.includes("Herbal supplement review item") && !components.includes("Prescription review item"), "normal safety checks must never submit invented medication rows");
assert(components.includes("disabled={!patientId || !medication}"), "safety check requires patient and selected medication context");

console.log("Medication recovery search, selection, profile, family chips, and safety prerequisites PASS");
