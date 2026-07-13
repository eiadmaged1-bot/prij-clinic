import { collectInventory, createPrisma } from "./production-launch-reset-config.mjs";

const prisma = createPrisma();
const failures = [];
const warnings = [];
const passes = [];

try {
  const inventory = await collectInventory(prisma);
  const byModel = new Map(inventory.map((item) => [item.model, item]));
  for (const model of ["Branch", "User", "Role", "Permission"]) {
    const count = Number(byModel.get(model)?.count || 0);
    if (count > 0) passes.push(`${model} preserved (${count})`);
    else failures.push(`${model} has no rows`);
  }
  for (const model of ["Patient", "Appointment", "QueueTicket", "Encounter", "Invoice", "Payment"]) {
    const count = Number(byModel.get(model)?.count || 0);
    if (count > 0) warnings.push(`${model} still has ${count} rows; acceptable before apply, not a clean post-reset baseline.`);
    else passes.push(`${model} has zero rows`);
  }
  for (const model of ["InvestigationCatalogItem", "ServiceItem", "MedicationGeneric"]) {
    const count = Number(byModel.get(model)?.count || 0);
    if (count > 0) passes.push(`${model} reference data present (${count})`);
    else warnings.push(`${model} has zero rows; verify reference seed/readiness before go-live.`);
  }
} finally {
  await prisma.$disconnect();
}

for (const pass of passes) console.log(`PRODUCTION-LAUNCH-VERIFY PASS ${pass}`);
for (const warning of warnings) console.log(`PRODUCTION-LAUNCH-VERIFY WARN ${warning}`);
for (const failure of failures) console.log(`PRODUCTION-LAUNCH-VERIFY FAIL ${failure}`);
console.log(`PRODUCTION-LAUNCH-VERIFY SUMMARY PASS ${passes.length} WARN ${warnings.length} FAIL ${failures.length}`);
if (failures.length) process.exitCode = 1;
