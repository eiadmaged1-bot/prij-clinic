import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const seed = await readFile("apps/api/prisma/seed.js", "utf8");
const reset = await readFile("scripts/reset-local-clinic-data.mjs", "utf8");

assert(seed.includes("PRIJ_SEED_MODE"), "seed mode environment variable is missing");
assert(seed.includes('SEED_DEMO_DATA === "true" ? "demo" : "clean"'), "clean mode is not the default seed path");
assert(seed.includes('where: { email: "eyad.admin@prij.local" }'), "protected eyad/System Owner bootstrap is missing");
assert(seed.includes("if (seedIsCleanMode)") && seed.indexOf("if (seedIsCleanMode)") < seed.indexOf("const serviceItems"), "clean mode must return before fake workflow records");

for (const model of ["patient", "appointment", "queueTicket", "encounter", "prescription", "investigationOrder", "report", "pregnancy", "obUltrasound", "invoice", "payment", "aiDraft", "patientClinicalMemory"]) {
  assert(reset.includes(`"${model}"`), `reset script does not include ${model}`);
}

for (const preserved of ["auditLog", "user", "role", "permission", "branch", "systemSetting", "guidelineSource", "drugMarketSource", "medicationDataSource"]) {
  assert(!reset.includes(`"${preserved}"`), `reset script must preserve ${preserved}`);
}

assert(reset.includes("--dry-run"), "reset script dry-run support is missing");
assert(reset.includes("Refusing to reset clinic data"), "reset script production refusal is missing");

console.log("DATA-HYGIENE PASS");
