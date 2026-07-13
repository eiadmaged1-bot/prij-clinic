import {
  collectInventory,
  createPrisma,
  databaseFingerprint,
  deleteOrder,
  renderPlanMarkdown,
  sha256,
  stableJson,
  writeLaunchReport
} from "./production-launch-reset-config.mjs";

const prisma = createPrisma();

try {
  const inventory = await collectInventory(prisma);
  const fingerprint = await databaseFingerprint(prisma, inventory);
  const byModel = new Map(inventory.map((item) => [item.model, item]));
  const deletePlan = deleteOrder
    .map((model) => byModel.get(model))
    .filter((item) => item && Number(item.count || 0) > 0)
    .filter((item) => item.category === "operational patient data" || item.category === "demo/test/placeholder")
    .map((item) => ({
      model: item.model,
      delegate: item.delegate,
      category: item.category,
      count: item.count,
      reason: item.reason,
      deleteScope: item.category === "operational patient data" ? "all rows in patient-linked operational launch-reset model" : "all rows in demo/test/placeholder launch-reset model"
    }));

  const preserved = inventory
    .filter((item) => !deletePlan.some((candidate) => candidate.model === item.model))
    .filter((item) => Number(item.count || 0) > 0)
    .map(({ model, category, count, reason }) => ({ model, category, count, reason }));

  const uncertain = inventory.filter((item) => item.category === "uncertain and requiring manual review" && Number(item.count || 0) > 0);
  const protectedDeletes = deletePlan.filter((item) => ["User", "UserRole", "Role", "Permission", "RolePermission", "Branch"].includes(item.model));
  const verifiedCatalogDeletes = deletePlan.filter((item) => item.category === "verified reference data");
  const confirmValue = `PRODUCTION_LAUNCH_RESET_${fingerprint.hash.slice(0, 12).toUpperCase()}`;
  const planWithoutHash = {
    sprint: "Production Launch Consolidation Mega Sprint",
    generatedAt: new Date().toISOString(),
    mode: "dry-run",
    databaseFingerprint: fingerprint,
    deletePlan,
    preserved,
    uncertain: uncertain.map(({ model, count, reason }) => ({ model, count, reason })),
    safetyGates: {
      dryRunDefault: true,
      applyRequiresBackupManifest: true,
      applyRequiresMatchingDatabaseFingerprint: true,
      applyRequiresExactPlanHash: true,
      applyRequiresExplicitFlag: "--apply",
      applyRequiresConfirmValue: confirmValue,
      unresolvedUncertainRecordsBlockApply: uncertain.length > 0,
      protectedUsersOrBranchesWouldBeDeleted: protectedDeletes.length > 0,
      verifiedCatalogsWouldBeDeleted: verifiedCatalogDeletes.length > 0
    },
    confirmValue
  };
  const planHash = sha256(stableJson(planWithoutHash));
  const plan = { ...planWithoutHash, planHash };
  const paths = await writeLaunchReport("production-launch-reset-plan", plan, renderPlanMarkdown(plan));
  const finalPlan = { ...plan, planPath: paths.jsonPath, markdownPath: paths.mdPath };
  await import("node:fs/promises").then((fs) => fs.writeFile(paths.jsonPath, `${JSON.stringify(finalPlan, null, 2)}\n`, "utf8"));
  await import("node:fs/promises").then((fs) => fs.writeFile(paths.mdPath, renderPlanMarkdown(finalPlan), "utf8"));
  console.log(`PRODUCTION-LAUNCH-RESET-PLAN wrote ${paths.jsonPath}`);
  console.log(`PRODUCTION-LAUNCH-RESET-PLAN wrote ${paths.mdPath}`);
  console.log(`PRODUCTION-LAUNCH-RESET-PLAN databaseFingerprint=${fingerprint.hash}`);
  console.log(`PRODUCTION-LAUNCH-RESET-PLAN planHash=${planHash}`);
  console.log(`PRODUCTION-LAUNCH-RESET-PLAN confirmValue=${confirmValue}`);
  console.log(`PRODUCTION-LAUNCH-RESET-PLAN dry-run only; apply requires backup manifest and explicit gates.`);
} finally {
  await prisma.$disconnect();
}
