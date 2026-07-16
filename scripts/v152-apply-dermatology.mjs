import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const { seedV152Dermatology, v152DermatologyTopics } = require("../apps/api/prisma/seeds/v152-dermatology");
const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

try {
  const existing = await prisma.dermatologyCondition.findMany({ select: { stableCode: true, reviewStatus: true } });
  const target = new Set(v152DermatologyTopics.map((topic) => topic.stableCode));
  const summary = { mode: apply ? "APPLY" : "DRY_RUN", targetTopics: target.size, createTopics: [...target].filter((code) => !existing.some((row) => row.stableCode === code)).length, updateTopics: [...target].filter((code) => existing.some((row) => row.stableCode === code)).length, preservedOtherTopics: existing.filter((row) => !target.has(row.stableCode)).length };
  console.log(JSON.stringify(summary, null, 2));
  if (apply) {
    const result = await seedV152Dermatology(prisma);
    await prisma.auditLog.create({ data: { action: "dermatology.knowledge.v152_source_imported", resourceType: "dermatology_condition", severity: "high", reason: "Official-source Dermatology knowledge import", metadataJson: { ...summary, ...result } } });
    console.log(`V152 DERMATOLOGY APPLY PASS topics=${result.topics} sources=${result.sources}`);
  }
} finally {
  await prisma.$disconnect();
}
