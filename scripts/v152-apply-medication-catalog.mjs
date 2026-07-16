import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const identity = JSON.parse(await readFile("apps/api/prisma/reference/v152-prescribable-rxnorm-atc.json", "utf8"));
const labels = JSON.parse(await readFile("apps/api/prisma/reference/v152-openfda-label-profiles.json", "utf8"));
if (identity.records.length < 500 || identity.selection.populatedFamilies < 120 || identity.selection.populatedFamilies > 180) throw new Error("Identity/family artifact failed minimum validation.");
if (labels.profiles.length < 300 || labels.source.status !== "SOURCE_VERIFIED") throw new Error("Official profile artifact failed minimum validation.");
const normalized = new Set(identity.records.map((row) => row.normalizedName));
const familyCodes = new Set(identity.records.flatMap((row) => row.families.map((family) => family.code)));

try {
  const [genericRows, familyRows, existingProfiles] = await Promise.all([
    prisma.medicationGeneric.findMany({ select: { id: true, normalizedName: true, isActive: true } }),
    prisma.drugFamily.findMany({ select: { id: true, code: true, active: true } }),
    prisma.medicationOfficialProfile.count()
  ]);
  const summary = {
    mode: apply ? "APPLY" : "DRY_RUN",
    identities: identity.records.length,
    createGenerics: identity.records.filter((row) => !genericRows.some((item) => item.normalizedName === row.normalizedName)).length,
    updateGenerics: identity.records.filter((row) => genericRows.some((item) => item.normalizedName === row.normalizedName)).length,
    deactivateLegacyGenerics: genericRows.filter((row) => row.isActive && !normalized.has(row.normalizedName)).length,
    activeFamiliesTarget: familyCodes.size,
    createFamilies: [...familyCodes].filter((code) => !familyRows.some((row) => row.code === code)).length,
    deactivateLegacyFamilies: familyRows.filter((row) => row.active && !familyCodes.has(row.code)).length,
    officialProfilesTarget: labels.profiles.length,
    existingOfficialProfiles: existingProfiles
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!apply) process.exitCode = 0;
  else await applyCatalog(summary);
} finally {
  await prisma.$disconnect();
}

async function applyCatalog(summary) {
  const job = await prisma.medicationDataImportJob.create({ data: { status: "running", fileName: "v152-prescribable-rxnorm-atc.json + v152-openfda-label-profiles.json", summaryText: JSON.stringify({ identityChecksum: identity.checksum, labelChecksum: labels.checksum, ...summary }) } });
  const identitySource = await prisma.pharmacologySource.upsert({
    where: { id: "00000000-0000-4000-8000-000000000152" },
    update: identitySourceData(),
    create: { id: "00000000-0000-4000-8000-000000000152", ...identitySourceData() }
  });
  await prisma.medicationGeneric.updateMany({ where: { normalizedName: { notIn: [...normalized] }, isActive: true }, data: { isActive: false, notes: "Retained historical identity; not part of the v1.5.2 bounded Current Prescribable Content catalog." } });
  await prisma.drugFamily.updateMany({ where: { code: { notIn: [...familyCodes] }, active: true }, data: { active: false, supersededReason: "Retained legacy family outside the v1.5.2 bounded active hierarchy." } });
  const familyByCode = new Map();
  for (const row of identity.records) for (const familyRow of row.families) {
    if (familyByCode.has(familyRow.code)) continue;
    const family = await prisma.drugFamily.upsert({ where: { code: familyRow.code }, update: { displayName: familyRow.name, normalizedSearchText: normalize(`${familyRow.code} ${familyRow.name}`), verificationStatus: "SOURCE_VERIFIED", active: true, bodySystem: bodySystem(familyRow.code), therapeuticGroup: familyRow.name, supersededReason: null }, create: { code: familyRow.code, displayName: familyRow.name, aliases: [], normalizedSearchText: normalize(`${familyRow.code} ${familyRow.name}`), verificationStatus: "SOURCE_VERIFIED", active: true, bodySystem: bodySystem(familyRow.code), therapeuticGroup: familyRow.name } });
    familyByCode.set(familyRow.code, family);
  }
  const genericByRxcui = new Map();
  for (const row of identity.records) {
    const medication = await prisma.medicationGeneric.upsert({ where: { normalizedName: row.normalizedName }, update: { genericName: row.name, isActive: true, sourceType: "rxnorm_current_prescribable", reviewStatus: "SOURCE_VERIFIED", aliases: row.aliases, notes: `RxNorm Current Prescribable Content RXCUI ${row.rxcui}. Patient-specific use and dose require Doctor confirmation.` }, create: { genericName: row.name, normalizedName: row.normalizedName, isActive: true, sourceType: "rxnorm_current_prescribable", reviewStatus: "SOURCE_VERIFIED", aliases: row.aliases, notes: `RxNorm Current Prescribable Content RXCUI ${row.rxcui}. Patient-specific use and dose require Doctor confirmation.` } });
    genericByRxcui.set(row.rxcui, medication);
    for (const familyRow of row.families) await prisma.genericMedicationFamilyMembership.upsert({ where: { medicationGenericId_familyId: { medicationGenericId: medication.id, familyId: familyByCode.get(familyRow.code).id } }, update: { sourceId: identitySource.id, reviewStatus: "SOURCE_VERIFIED" }, create: { medicationGenericId: medication.id, familyId: familyByCode.get(familyRow.code).id, sourceId: identitySource.id, reviewStatus: "SOURCE_VERIFIED" } });
  }
  for (const profile of labels.profiles) {
    const medication = genericByRxcui.get(profile.rxcui);
    if (!medication) throw new Error(`Profile identity is absent for RXCUI ${profile.rxcui}`);
    const effectiveDate = parseDate(profile.source.effectiveTime);
    const retrievedAt = new Date(profile.source.retrievedAt);
    const publicationState = profile.conflicts ? "SOURCE_CONFLICT" : "SOURCE_VERIFIED";
    const sourceData = { title: `${profile.genericName} official drug label`, organization: "U.S. Food and Drug Administration / DailyMed", sourceUrl: profile.source.sourceUrl, versionLabel: profile.source.version ? String(profile.source.version) : profile.source.effectiveTime, publishedAt: effectiveDate, provenanceType: "official_structured_product_label", reviewStatus: publicationState, sourceIdentifier: profile.source.setId, effectiveDate, retrievedAt, checksum: labels.checksum, sourceSection: "FDA Structured Product Label sections", publicationState };
    const source = await prisma.pharmacologySource.upsert({ where: { id: profile.source.setId }, update: sourceData, create: { id: profile.source.setId, ...sourceData } });
    const sections = profile.sections;
    const data = { sourceId: source.id, publicationState, sectionCoverageJson: Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, value.status])), indicationsJson: sections.indications.referenceText, mechanismJson: sections.mechanism.referenceText, contraindicationsJson: sections.contraindications.referenceText, warningsJson: sections.warnings.referenceText, adverseEffectsJson: sections.adverseEffects.referenceText, interactionsJson: sections.interactions.referenceText, pregnancyJson: sections.pregnancy.referenceText, lactationJson: sections.lactation.referenceText, renalJson: sections.renal.referenceText, hepaticJson: sections.hepatic.referenceText, monitoringJson: sections.monitoring.referenceText, routesJson: sections.routes.referenceText, dosageFormsJson: sections.dosageForms.referenceText, sourceSectionMapJson: Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, value.sourceSections])), conflictJson: profile.conflicts ?? undefined, boxedWarning: profile.boxedWarning, effectiveDate, retrievedAt };
    await prisma.medicationOfficialProfile.upsert({ where: { medicationGenericId: medication.id }, update: data, create: { medicationGenericId: medication.id, ...data } });
  }
  await prisma.medicationDataImportJob.update({ where: { id: job.id }, data: { status: "completed", summaryText: JSON.stringify({ ...summary, appliedAt: new Date().toISOString(), identityChecksum: identity.checksum, labelChecksum: labels.checksum }) } });
  await prisma.auditLog.create({ data: { action: "medication.catalog.v152_source_imported", resourceType: "medication_data_import_job", resourceId: job.id, severity: "high", reason: "Official-source governed v1.5.2 catalog import", metadataJson: { genericCount: identity.records.length, activeFamilyCount: familyCodes.size, officialProfileCount: labels.profiles.length, identityChecksum: identity.checksum, labelChecksum: labels.checksum } } });
  console.log(`V152 MEDICATION APPLY PASS job=${job.id} generics=${identity.records.length} activeFamilies=${familyCodes.size} profiles=${labels.profiles.length}`);
}

function identitySourceData() { return { title: "RxNorm Current Prescribable Content with ATC classifications", organization: "U.S. National Library of Medicine / WHO Collaborating Centre", sourceUrl: identity.source.api, versionLabel: `${identity.source.identityVersion}; ATC ${identity.source.atcVersion}`, provenanceType: "official_identity_classification", reviewStatus: "SOURCE_VERIFIED", sourceIdentifier: "rxnorm-prescribable-atc-v152", retrievedAt: new Date(identity.source.retrievedAt), checksum: identity.checksum, sourceSection: "IN/PIN identities and RxClass ATC membership", publicationState: "SOURCE_VERIFIED" }; }
function parseDate(value) { if (!/^\d{8}$/.test(String(value ?? ""))) return null; return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00.000Z`); }
function normalize(value) { return String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}%/.\s-]+/gu, " ").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim(); }
function bodySystem(code) { const prefix = code[0]; return ({ A: "Alimentary and metabolic", B: "Blood", C: "Cardiovascular", D: "Dermatology", G: "Genitourinary and reproductive", H: "Systemic hormones", J: "Anti-infectives", L: "Antineoplastic and immunomodulating", M: "Musculoskeletal", N: "Nervous system", P: "Antiparasitic", R: "Respiratory", S: "Sensory organs", V: "Various" })[prefix] ?? "Other"; }
