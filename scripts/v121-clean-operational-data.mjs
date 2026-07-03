import {
  applyDeletePlan,
  assertSafeApply,
  buildOperationalDeletePlan,
  createPrisma,
  currentAppEnv,
  findTargetPatients,
  parseFlags
} from "./v121-reference-utils.mjs";

const flags = parseFlags();
const prisma = createPrisma();

try {
  if (flags.apply) assertSafeApply();
  const targets = await findTargetPatients(prisma, flags.allOperationalLocal);
  const patientIds = targets.map((patient) => patient.id);
  const plan = await buildOperationalDeletePlan(prisma, patientIds);
  const result = {
    mode: flags.apply ? "apply" : "dry-run",
    appEnv: currentAppEnv(),
    allOperationalLocal: flags.allOperationalLocal,
    targetPatients: targets.length,
    deletePlan: plan.map(({ label, model, count }) => ({ label, model, count })),
    preserved: [
      "User",
      "Role",
      "Permission",
      "Branch",
      "AuditLog",
      "ClinicalProtocol",
      "GuidelineSource",
      "GuidelineDocument",
      "GuidelineChunk",
      "medication reference tables",
      "drug market reference/import tables",
      "InvestigationCatalogItem",
      "ServiceItem",
      "OperationCatalogItem"
    ]
  };

  if (flags.json) console.log(JSON.stringify(result, null, 2));
  else printResult(result, targets);

  if (flags.apply) {
    await applyDeletePlan(prisma, plan);
    console.log("V121-CLEAN PASS apply completed");
  } else {
    console.log("V121-CLEAN DRY-RUN only. Use --apply in APP_ENV local/dev/development/test/ci to delete targeted operational rows.");
  }
} finally {
  await prisma.$disconnect();
}

function printResult(result, targets) {
  console.log(`V121 CLEAN OPERATIONAL DATA ${result.mode.toUpperCase()}`);
  console.log(`APP_ENV=${result.appEnv}`);
  console.log(`all operational local baseline: ${result.allOperationalLocal}`);
  console.log(`target patients: ${result.targetPatients}`);
  for (const patient of targets.slice(0, 20)) {
    console.log(`target patient ${patient.medicalRecordNumber}: ${patient.firstName} ${patient.lastName}`);
  }
  if (targets.length > 20) console.log(`target patient list truncated: ${targets.length - 20} more`);
  for (const item of result.deletePlan) console.log(`${result.mode === "apply" ? "delete" : "would delete"} ${item.label}: ${item.count}`);
  console.log(`preserved: ${result.preserved.join(", ")}`);
}
