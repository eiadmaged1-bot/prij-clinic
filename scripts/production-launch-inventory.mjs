import { collectInventory, createPrisma, databaseFingerprint, renderInventoryMarkdown, writeLaunchReport } from "./production-launch-reset-config.mjs";

const prisma = createPrisma();

try {
  const models = await collectInventory(prisma);
  const fingerprint = await databaseFingerprint(prisma, models);
  const report = {
    sprint: "Production Launch Consolidation Mega Sprint",
    generatedAt: new Date().toISOString(),
    databaseFingerprint: fingerprint,
    models
  };
  const markdown = renderInventoryMarkdown(report);
  const paths = await writeLaunchReport("production-launch-inventory", report, markdown);
  console.log(`PRODUCTION-LAUNCH-INVENTORY wrote ${paths.jsonPath}`);
  console.log(`PRODUCTION-LAUNCH-INVENTORY wrote ${paths.mdPath}`);
  console.log(`PRODUCTION-LAUNCH-INVENTORY databaseFingerprint=${fingerprint.hash}`);
} finally {
  await prisma.$disconnect();
}
