import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const prisma = new PrismaClient();
const [identityText, labelText, service, workspace, importer] = await Promise.all([
  readFile("apps/api/prisma/reference/v152-prescribable-rxnorm-atc.json", "utf8"),
  readFile("apps/api/prisma/reference/v152-openfda-label-profiles.json", "utf8"),
  readFile("apps/api/src/medications/medications.service.ts", "utf8"),
  readFile("apps/web/components/medications/PharmacologyWorkspace.tsx", "utf8"),
  readFile("scripts/v152-apply-medication-catalog.mjs", "utf8")
]);
const identity = JSON.parse(identityText);
const labels = JSON.parse(labelText);

assert(identity.records.length >= 500);
assert(identity.selection.populatedFamilies >= 120 && identity.selection.populatedFamilies <= 180);
assert.equal(new Set(identity.records.map((row) => row.normalizedName)).size, identity.records.length, "RxNorm identities must be deduplicated");
assert(labels.profiles.length >= 300);
for (const profile of labels.profiles) {
  assert(profile.source.setId && profile.source.sourceUrl && profile.source.retrievedAt, "every profile needs exact provenance");
  for (const section of Object.values(profile.sections)) {
    assert(["SOURCE_VERIFIED", "SOURCE_INCOMPLETE"].includes(section.status));
    if (section.referenceText.length) assert.equal(section.status, "SOURCE_VERIFIED");
  }
}
assert.match(importer, /--apply/);
assert.match(importer, /DRY_RUN/);
assert.match(importer, /medication\.catalog\.v152_source_imported/);
assert.match(service, /MedicationOfficialProfile|medicationOfficialProfile/);
assert.match(service, /SOURCE_CONFLICT/);
assert.match(workspace, /No unified interpretation was generated/);
assert.match(workspace, /Doctor confirmation/);

try {
  const [activeGenerics, activeFamilies, unlinked, duplicates, profiles, sources] = await Promise.all([
    prisma.medicationGeneric.count({ where: { isActive: true } }),
    prisma.drugFamily.count({ where: { active: true } }),
    prisma.medicationGeneric.count({ where: { isActive: true, familyMemberships: { none: { family: { active: true } } } } }),
    prisma.medicationGeneric.groupBy({ by: ["normalizedName"], _count: { _all: true }, having: { normalizedName: { _count: { gt: 1 } } } }),
    prisma.medicationOfficialProfile.findMany({ include: { source: true } }),
    prisma.pharmacologySource.count({ where: { publicationState: { in: ["SOURCE_VERIFIED", "SOURCE_CONFLICT"] }, retrievedAt: { not: null }, sourceIdentifier: { not: null } } })
  ]);
  assert(activeGenerics >= 500);
  assert(activeFamilies >= 120 && activeFamilies <= 180);
  assert(unlinked / activeGenerics < 0.02);
  assert.equal(duplicates.length, 0);
  assert(profiles.length >= 300);
  assert(sources >= 300);
  for (const profile of profiles) {
    assert(profile.source.sourceIdentifier && profile.source.retrievedAt && profile.source.sourceSection);
    assert(["SOURCE_VERIFIED", "SOURCE_CONFLICT", "SOURCE_INCOMPLETE"].includes(profile.publicationState));
  }
  console.log(`v1.5.2 medication provenance PASS generics=${activeGenerics} families=${activeFamilies} profiles=${profiles.length} unlinked=${unlinked}`);
} finally {
  await prisma.$disconnect();
}
