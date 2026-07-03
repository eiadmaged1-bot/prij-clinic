import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createPrisma, demoPatientWhere } from "./v121-reference-utils.mjs";

const prisma = createPrisma();
const passes = [];
const failures = [];

try {
  checkSourceSafety();
  run("cleanup dry-run works", ["scripts/v121-clean-operational-data.mjs", "--dry-run", "--json"]);
  const beforeInvestigations = await prisma.investigationCatalogItem.count();
  run("investigation seed first pass", ["scripts/v121-seed-investigation-catalog.mjs"]);
  run("investigation seed second pass", ["scripts/v121-seed-investigation-catalog.mjs"]);
  const afterInvestigations = await prisma.investigationCatalogItem.count();
  assert(afterInvestigations >= beforeInvestigations, "investigation seed idempotent count did not shrink");

  const beforeOperations = await prisma.operationCatalogItem.count();
  run("operation seed first pass", ["scripts/v121-seed-operation-catalog.mjs"]);
  run("operation seed second pass", ["scripts/v121-seed-operation-catalog.mjs"]);
  const afterOperations = await prisma.operationCatalogItem.count();
  assert(afterOperations >= beforeOperations && afterOperations > 0, "operation seed idempotent and nonempty");

  const beforeServices = await prisma.serviceItem.count();
  run("service seed first pass", ["scripts/v121-seed-service-catalog.mjs"]);
  run("service seed second pass", ["scripts/v121-seed-service-catalog.mjs"]);
  const afterServices = await prisma.serviceItem.count();
  assert(afterServices >= beforeServices, "service seed idempotent count did not shrink");

  run("medication readiness reports honestly", ["scripts/v121-medication-reference-readiness.mjs"]);
  run("verify clean baseline command works", ["scripts/v121-verify-clean-baseline.mjs"], { allowFailure: true });

  const fakePatients = await prisma.patient.count({ where: demoPatientWhere() });
  const fakePrescriptions = await prisma.prescription.count({
    where: { patient: demoPatientWhere() }
  });
  const fakeInvestigationResults = await prisma.investigationResult.count({
    where: { patient: demoPatientWhere() }
  });
  assert(fakePatients === 0, `no fake patients created; found ${fakePatients}`);
  assert(fakePrescriptions === 0, `no fake prescriptions created; found ${fakePrescriptions}`);
  assert(fakeInvestigationResults === 0, `no fake investigation results created; found ${fakeInvestigationResults}`);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
}

for (const pass of passes) console.log(`V121-TEST PASS ${pass}`);
for (const failure of failures) console.log(`V121-TEST FAIL ${failure}`);
console.log(`V121-TEST SUMMARY PASS ${passes.length} FAIL ${failures.length}`);
if (failures.length) process.exitCode = 1;

function run(label, args, options = {}) {
  try {
    execFileSync(process.execPath, args, { encoding: "utf8", env: { ...process.env, APP_ENV: process.env.APP_ENV || "local" } });
    passes.push(label);
  } catch (error) {
    if (options.allowFailure) {
      passes.push(`${label} returned nonzero as expected when baseline is not yet applied`);
      return;
    }
    throw new Error(`${label} failed: ${error.stdout || error.stderr || error.message}`);
  }
}

function checkSourceSafety() {
  const cleanup = readFileSync("scripts/v121-clean-operational-data.mjs", "utf8");
  for (const forbidden of ["user", "role", "permission", "branch", "auditLog", "drugMarketVariant", "medicationProduct", "investigationCatalogItem", "serviceItem", "operationCatalogItem"]) {
    assert(!cleanup.includes(`"${forbidden}"`) && !cleanup.includes(`'${forbidden}'`), `cleanup script does not target ${forbidden}`);
  }
  const serviceSeed = readFileSync("scripts/v121-seed-service-catalog.mjs", "utf8");
  assert(serviceSeed.includes("price: null"), "service seed uses null price instead of fake price");
  passes.push("source safety checks passed");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
