import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env.js");
loadRootEnv();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const appEnv = process.env.APP_ENV || (process.env.NODE_ENV === "production" ? "production" : "local");
const databaseUrl = process.env.DATABASE_URL || "";

const patientWorkflowModels = [
  "medicationSafetyAlert",
  "medicationSafetyCheck",
  "patientClinicalMemory",
  "aiManagementSnapshot",
  "aiDraft",
  "payment",
  "invoice",
  "obUltrasound",
  "antenatalVisit",
  "pregnancyFetus",
  "previousPregnancy",
  "pregnancy",
  "gynecologyVisit",
  "report",
  "investigationOrder",
  "prescription",
  "encounter",
  "queueTicket",
  "appointment",
  "consentRecord",
  "patientMedication",
  "patientAllergy",
  "patient"
];

function refuseProduction() {
  const looksProduction =
    appEnv === "production" ||
    process.env.NODE_ENV === "production" ||
    /prod|production/i.test(databaseUrl) ||
    process.env.ALLOW_LOCAL_DATA_RESET === "production";

  if (looksProduction) {
    throw new Error("Refusing to reset clinic data in a production-like environment.");
  }
}

async function counts() {
  const entries = [];
  for (const model of patientWorkflowModels) {
    if (!prisma[model]?.count) {
      throw new Error(`Reset script references missing Prisma model: ${model}`);
    }
    entries.push([model, await prisma[model].count()]);
  }
  return entries;
}

async function deleteWorkflowData() {
  return prisma.$transaction(
    patientWorkflowModels.map((model) => prisma[model].deleteMany())
  );
}

async function main() {
  refuseProduction();

  const before = await counts();
  console.log(`Local clinic data reset ${dryRun ? "dry run" : "execution"}`);
  for (const [model, count] of before) {
    console.log(`${model}: ${count}`);
  }

  if (dryRun) {
    console.log("Dry run only. No records were deleted.");
    return;
  }

  await deleteWorkflowData();
  console.log("Deleted patient workflow data. Preserved users, RBAC, branches, system settings, audit logs, and reference data.");
}

await main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
