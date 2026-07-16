import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const { seedV152GuidelineRegistry, v152GuidelineRegistryDocuments } = require("../apps/api/prisma/seeds/v152-guideline-registry");
const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

try {
  const before = await prisma.guidelineDocument.count();
  const duplicateTitles = await prisma.$queryRaw`SELECT lower(trim(title)) AS title, "sourceId", coalesce("versionLabel", '') AS version, count(*)::int AS count FROM "GuidelineDocument" GROUP BY lower(trim(title)), "sourceId", coalesce("versionLabel", '') HAVING count(*) > 1`;
  const summary = { mode: apply ? "APPLY" : "DRY_RUN", before, targetRegistryRows: v152GuidelineRegistryDocuments.length, existingDuplicateTitleVersions: duplicateTitles.length };
  console.log(JSON.stringify(summary, null, 2));
  if (apply) {
    const result = await seedV152GuidelineRegistry(prisma);
    const after = await prisma.guidelineDocument.count();
    await prisma.auditLog.create({ data: { action: "guideline.registry.v152_official_metadata_imported", resourceType: "guideline_document", severity: "high", reason: "Idempotent official link-only guideline metadata registry import", metadataJson: { ...summary, ...result, after } } });
    console.log(JSON.stringify({ ...result, after }, null, 2));
  }
} finally { await prisma.$disconnect(); }
