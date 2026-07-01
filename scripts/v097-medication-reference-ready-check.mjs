import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const requireMedications = process.argv.includes("--require-medications");
const passes = [];
const warnings = [];
const failures = [];

try {
  await checkModels();
  await checkCounts();
  await checkUnsafeMetadata();
  await checkSearch();
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
}

for (const item of passes) console.log(`V097-MED-READY PASS ${item}`);
for (const item of warnings) console.log(`V097-MED-READY WARN ${item}`);
for (const item of failures) console.log(`V097-MED-READY FAIL ${item}`);
console.log(`V097-MED-READY SUMMARY PASS ${passes.length} WARN ${warnings.length} FAIL ${failures.length}`);
if (failures.length) process.exitCode = 1;

async function checkModels() {
  for (const model of ["drugMarketCountry", "drugMarketSource", "drugMarketProduct", "drugMarketVariant", "medicationProduct"]) {
    assert(prisma[model]?.count, `${model} model exists`);
  }
  passes.push("medication and drug-market reference models exist");
}

async function checkCounts() {
  const official = await prisma.drugMarketVariant.count({ where: { isDemo: false } });
  const verified = await prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "verified" } });
  const needsReview = await prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "needs_review" } });
  console.log(`official medication rows: ${official}`);
  console.log(`verified medication rows: ${verified}`);
  console.log(`needs_review medication rows: ${needsReview}`);
  const byCountry = await prisma.drugMarketVariant.groupBy({ by: ["countryCode", "verificationStatus"], where: { isDemo: false }, _count: { _all: true }, orderBy: [{ countryCode: "asc" }, { verificationStatus: "asc" }] });
  for (const row of byCountry) console.log(`country/status ${row.countryCode}/${row.verificationStatus}: ${row._count._all}`);
  if (official === 0) {
    const message = "official medication rows are absent; restore from an approved official export/source before strict manual medication QA";
    if (requireMedications) failures.push(message);
    else warnings.push(message);
  } else {
    passes.push(`official medication rows available (${official})`);
  }
}

async function checkUnsafeMetadata() {
  const unsafe = await prisma.drugMarketVariant.findFirst({
    where: {
      isDemo: false,
      OR: [
        { tradeName: { contains: "take one", mode: "insensitive" } },
        { genericName: { contains: "how to take", mode: "insensitive" } },
        { strengthText: { contains: "patient instruction", mode: "insensitive" } },
        { packageText: { contains: "checkout", mode: "insensitive" } },
        { packageText: { contains: "in stock", mode: "insensitive" } },
        { packageText: { contains: "order now", mode: "insensitive" } }
      ]
    }
  });
  assert(!unsafe, "market metadata does not expose patient dosing/stock/checkout wording");
  passes.push("market metadata remains reference-only, with no patient dosing/stock/checkout wording detected");
}

async function checkSearch() {
  const row = await prisma.drugMarketVariant.findFirst({
    where: { isDemo: false, verificationStatus: { in: ["verified", "needs_review"] } },
    include: { product: true },
    orderBy: [{ verificationStatus: "asc" }, { tradeName: "asc" }]
  });
  if (!row) {
    warnings.push("no verified or needs_review official row is available for medication search selection");
    return;
  }
  for (const [label, value] of [
    ["trade name", row.tradeName],
    ["generic/scientific name", row.genericName ?? row.product.genericName],
    ["strength/form", row.strengthText ?? row.dosageForm],
    ["country/source", row.countryCode]
  ]) {
    if (!value) continue;
    const found = await prisma.drugMarketVariant.findFirst({
      where: {
        isDemo: false,
        verificationStatus: { in: ["verified", "needs_review"] },
        OR: [
          { tradeName: { contains: value, mode: "insensitive" } },
          { genericName: { contains: value, mode: "insensitive" } },
          { strengthText: { contains: value, mode: "insensitive" } },
          { dosageForm: { contains: value, mode: "insensitive" } },
          { countryCode: { equals: value, mode: "insensitive" } }
        ]
      }
    });
    assert(found, `search can find by ${label}`);
  }
  passes.push(`medication search can find review-ready row ${row.id}`);
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
