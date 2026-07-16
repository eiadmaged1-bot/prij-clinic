import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
const require = createRequire(import.meta.url); require("../apps/api/prisma/env").loadRootEnv();
const { seedV152InvestigationSets, v152InvestigationSets } = require("../apps/api/prisma/seeds/v152-investigation-sets");
const prisma = new PrismaClient(); const apply = process.argv.includes("--apply");
try {
  const existing = await prisma.investigationFavoriteSet.count({ where: { publicationState: "SOURCE_VERIFIED_REFERENCE" } });
  console.log(JSON.stringify({ mode: apply ? "APPLY" : "DRY_RUN", target: v152InvestigationSets.length, existing }, null, 2));
  if (apply) { const result = await seedV152InvestigationSets(prisma); await prisma.auditLog.create({ data: { action: "investigation.sets.v152_source_imported", resourceType: "investigation_favorite_set", severity: "high", reason: "Idempotent source-linked clinic investigation set import", metadataJson: { ...result, automaticOrdersCreated: 0 } } }); console.log(JSON.stringify(result, null, 2)); }
} finally { await prisma.$disconnect(); }
