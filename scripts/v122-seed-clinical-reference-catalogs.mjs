import { spawn } from "node:child_process";
import { createPrisma } from "./v121-reference-utils.mjs";

const steps = [
  ["medication generic foundation", "scripts/v122-seed-medication-generic-foundation.mjs"],
  ["investigation expanded catalog", "scripts/v122-seed-investigation-expanded-catalog.mjs"],
  ["operation history catalog", "scripts/v122-seed-operation-history-catalog.mjs"]
];

for (const [label, script] of steps) {
  await run(label, script);
}

const prisma = createPrisma();
try {
  const counts = {
    medicationGenerics: await prisma.medicationGeneric.count(),
    medicationTags: await prisma.medicationSearchTag.count(),
    medicationClasses: await prisma.medicationClass.count(),
    controlledMedicationGenerics: await prisma.medicationGeneric.count({ where: { isControlled: true } }),
    investigations: await prisma.investigationCatalogItem.count({ where: { active: true } }),
    operations: await prisma.operationCatalogItem.count({ where: { isActive: true } })
  };
  console.log(`V122-SEED-CLINICAL-REFERENCE PASS ${JSON.stringify(counts)}`);
} finally {
  await prisma.$disconnect();
}

function run(label, script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { stdio: "inherit", shell: false });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
    child.on("error", reject);
  });
}
