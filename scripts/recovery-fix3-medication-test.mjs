import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import { parseOfficialFile } from "./official-medication-utils.mjs";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const prisma = new PrismaClient();
const file = "local-reference/egyptian-drugs/egyptian-drugs.csv";
const expectedChecksum = "43f91aaf53537222dcdcf538c41e125c4e5d65570a77c4e044e38f1ce107f030";

try {
  const bytes = await readFile(file);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedChecksum);
  const parsed = await parseOfficialFile(file, "EGYPTIAN_DRUG_DATABASE_CC0");
  assert.equal(parsed.rows.length, 25_094);

  const source = await prisma.drugMarketSource.findUniqueOrThrow({ where: { code: "EGYPTIAN_DRUG_DATABASE_CC0" } });
  const variants = await prisma.drugMarketVariant.findMany({
    where: { sourceId: source.id, countryCode: "EG", isDemo: false },
    select: { sourceRowHash: true }
  });
  assert.equal(variants.length, 22_755);
  assert.equal(new Set(variants.map((item) => item.sourceRowHash)).size, variants.length);

  const products = await prisma.drugMarketProduct.count({
    where: { variants: { some: { sourceId: source.id, countryCode: "EG", isDemo: false } } }
  });
  assert.equal(products, 18_069);

  const links = await prisma.medicationAlias.findMany({
    where: { scopeType: "SOURCE_MARKET", scopeId: source.id, status: "active", normalizedAlias: { in: ["panadol advance", "glucophage", "augmentin"] } },
    include: { medication: { select: { genericName: true } } }
  });
  const linked = new Map();
  for (const link of links) {
    const values = linked.get(link.normalizedAlias) ?? [];
    values.push(link.medication.genericName.toLowerCase());
    linked.set(link.normalizedAlias, values);
  }
  assert(linked.get("panadol advance")?.some((item) => item === "paracetamol"));
  assert(linked.get("glucophage")?.some((item) => item === "metformin"));
  assert.deepEqual(new Set(linked.get("augmentin")), new Set(["amoxicillin", "clavulanic acid"]));

  const ambiguous = await prisma.drugMarketProduct.findFirstOrThrow({
    where: { tradeName: { contains: "ABASAGLAR", mode: "insensitive" }, verificationStatus: "mapping_under_review" }
  });
  assert(ambiguous.normalizedSearchText.includes("abasaglar"));
  assert((await prisma.drugMarketManualReviewQueue.count({ where: { productId: ambiguous.id, status: "open" } })) > 0);

  const createdGeneric = await prisma.medicationGeneric.findUniqueOrThrow({ where: { normalizedName: "clavulanic acid" } });
  assert.equal(createdGeneric.isActive, false);
  assert.equal(createdGeneric.reviewStatus, "needs_review");
  assert.equal(await prisma.medicationSafetyProfile.count({ where: { medicationGenericId: createdGeneric.id } }), 0);

  const lastRun = await prisma.drugMarketImportRun.findFirstOrThrow({ where: { sourceId: source.id, dryRun: false }, orderBy: { startedAt: "desc" } });
  const coverage = lastRun.coverageJson;
  assert(coverage && typeof coverage === "object" && !Array.isArray(coverage));
  assert.equal(coverage.productsInserted, 0);
  assert.equal(coverage.variantsInserted, 0);
  assert.equal(coverage.aliasesInserted, 0);
  assert.equal(coverage.aliasesQuarantined, 0);
  assert.equal(coverage.reviewRecordsInserted, 0);

  const protectedCounts = {
    safetyProfiles: await prisma.medicationSafetyProfile.count(),
    prescriptions: await prisma.prescription.count(),
    prescriptionItems: await prisma.prescriptionItem.count(),
    templates: await prisma.prescriptionTemplate.count(),
    patientMedications: await prisma.patientMedication.count(),
    allergies: await prisma.patientAllergy.count()
  };
  assert.deepEqual(protectedCounts, { safetyProfiles: 35, prescriptions: 195, prescriptionItems: 195, templates: 4, patientMedications: 0, allergies: 0 });

  console.log(JSON.stringify({ status: "PASS", rows: parsed.rows.length, products, variants: variants.length, reviewRecords: await prisma.drugMarketManualReviewQueue.count(), protectedCounts }));
} finally {
  await prisma.$disconnect();
}
