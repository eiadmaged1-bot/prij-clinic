import fs from "node:fs/promises";
import path from "node:path";
import {
  collectInventory,
  createPrisma,
  databaseFingerprint,
  hasFlag,
  parseArg,
  sha256,
  stableJson
} from "./production-launch-reset-config.mjs";

const planPath = parseArg("--plan");
const backupManifestPath = parseArg("--backup-manifest");
const confirm = parseArg("--confirm");

if (!hasFlag("--apply")) {
  throw new Error("Refusing to run: reset apply requires explicit --apply. No database changes were made.");
}

if (!planPath || !backupManifestPath || !confirm) {
  throw new Error("Refusing to run: --plan, --backup-manifest, and --confirm are required.");
}

const prisma = createPrisma();

try {
  const plan = JSON.parse(await fs.readFile(planPath, "utf8"));
  const manifest = JSON.parse(await fs.readFile(backupManifestPath, "utf8"));
  const { planHash, planPath: _planPath, markdownPath: _markdownPath, ...planForHash } = plan;
  const recalculatedPlanHash = sha256(stableJson(planForHash));

  if (recalculatedPlanHash !== planHash) throw new Error("Refusing to run: plan hash does not match plan contents.");
  if (confirm !== plan.confirmValue) throw new Error("Refusing to run: confirm value does not match the reset plan.");
  if (manifest.databaseFingerprint !== plan.databaseFingerprint.hash) throw new Error("Refusing to run: backup manifest database fingerprint does not match the reset plan.");
  if (!manifest.databaseBackupPath || !manifest.uploadedFilesBackupPath) throw new Error("Refusing to run: backup manifest must include databaseBackupPath and uploadedFilesBackupPath.");
  if (!path.isAbsolute(manifest.databaseBackupPath) || !path.isAbsolute(manifest.uploadedFilesBackupPath)) throw new Error("Refusing to run: backup paths must be absolute and outside the Git source path.");
  if (manifest.databaseBackupPath.startsWith(process.cwd()) || manifest.uploadedFilesBackupPath.startsWith(process.cwd())) throw new Error("Refusing to run: backup output must be outside the Git-tracked source path.");
  if (plan.safetyGates?.unresolvedUncertainRecordsBlockApply) throw new Error("Refusing to run: unresolved uncertain records remain.");
  if (plan.safetyGates?.protectedUsersOrBranchesWouldBeDeleted) throw new Error("Refusing to run: production clinic users or branches would be deleted.");
  if (plan.safetyGates?.verifiedCatalogsWouldBeDeleted) throw new Error("Refusing to run: verified catalogs would be deleted.");

  const inventory = await collectInventory(prisma);
  const currentFingerprint = await databaseFingerprint(prisma, inventory);
  if (currentFingerprint.hash !== plan.databaseFingerprint.hash) throw new Error("Refusing to run: database changed after plan generation.");

  const deletionReport = [];
  await prisma.$transaction(async (tx) => {
    for (const item of plan.deletePlan) {
      const delegate = tx[item.delegate];
      if (!delegate?.deleteMany) throw new Error(`Prisma delegate missing for ${item.model}.`);
      const result = await delegate.deleteMany({});
      deletionReport.push({ model: item.model, deleted: result.count, planned: item.count });
    }
  });

  console.log("PRODUCTION-LAUNCH-RESET-APPLY deletion report");
  for (const item of deletionReport) console.log(`${item.model}: deleted=${item.deleted} planned=${item.planned}`);
  console.log("PRODUCTION-LAUNCH-RESET-APPLY preserved models");
  for (const item of plan.preserved) console.log(`${item.model}: preserved=${item.count} category=${item.category}`);
} finally {
  await prisma.$disconnect();
}
