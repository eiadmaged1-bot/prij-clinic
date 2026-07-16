import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [artifactText, seed, service, controller, pharmacology, dermatology, en] = await Promise.all([
  readFile("apps/api/prisma/reference/v151-rxnav-atc-identity.json", "utf8"),
  readFile("apps/api/prisma/seeds/v151-medication-dermatology.js", "utf8"),
  readFile("apps/api/src/medications/medications.service.ts", "utf8"),
  readFile("apps/api/src/medications/medications.controller.ts", "utf8"),
  readFile("apps/web/components/medications/PharmacologyWorkspace.tsx", "utf8"),
  readFile("apps/web/components/medications/DermatologyWorkspace.tsx", "utf8"),
  readFile("apps/web/i18n/en.ts", "utf8")
]);
const artifact = JSON.parse(artifactText);
assert.equal(artifact.source.identity, "RxNorm");
assert.equal(artifact.source.identityOrganization, "U.S. National Library of Medicine");
assert.equal(artifact.source.classification, "ATC");
assert.match(artifact.source.rxClassAtcVersion, /^2026_/);
assert(artifact.records.length >= 300 && artifact.records.length <= 400, "bounded active identity target must be 300-400");
assert(new Set(artifact.records.flatMap((record) => record.families.map((family) => family.code))).size >= 100, "at least 100 ATC families required");
for (const record of artifact.records) { assert(record.rxcui); assert(record.name); assert(record.families.length); assert(!("mechanism" in record)); assert(!("dose" in record)); }
assert.match(seed, /clinical sections require separate sources and review/);
assert.match(seed, /needs_clinical_review/g);
for (const topic of ["Acne", "Hyperpigmentation", "Melasma", "Eczema / dermatitis", "Psoriasis", "Fungal infections", "Rosacea", "Urticaria", "Alopecia", "Hirsutism", "Intertrigo", "Vulvar dermatology", "Sensitive-area pigmentation"]) assert.match(seed, new RegExp(topic.replace("/", "\\/")));
for (const source of ["NICE", "American Academy of Dermatology", "British Association of Dermatologists", "American College of Obstetricians and Gynecologists", "Endocrine Society"]) assert.match(seed, new RegExp(source));
for (const room of ["Respiratory", "Cardiovascular", "Anti-infectives", "Obstetrics & Gynecology", "Endocrine", "Neurology & Psychiatry", "Pain & Inflammation", "Gastrointestinal", "Renal & Urology", "Hematology", "Dermatology", "Allergy & Immunology", "Emergency medicines", "Oncology", "Supplements"]) assert.match(service, new RegExp(room.replace("&", "&")));
assert.match(controller, /dermatology\/atlas/);
assert.match(service, /noAutomaticDiagnosisOrTreatment/);
assert.match(pharmacology, /sectionStatuses/);
for (const key of ["backToTopics", "previousTopic", "nextTopic", "reset", "openSource", "redFlagsEscalation", "whenToRefer", "pregnancyLactation", "dermatologySafety"]) {
  assert.match(dermatology, new RegExp(`t\\(\"${key}\"\\)`));
  assert.match(en, new RegExp(`${key}:\\s*\"[^\"]+\"`));
}
assert.match(en, /never diagnoses or selects treatment/i);
assert.doesNotMatch(dermatology, /auto(?:matically)?[- ](?:diagnos|prescrib|treat)/i);

console.log(`v1.5.1 source-governed pharmacology identities (${artifact.records.length}) and 13-topic Dermatology workspace contracts PASS`);
