import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
const { seedInvestigationCatalog } = require("../apps/api/prisma/seeds/investigation-catalog");

loadRootEnv();

const prisma = new PrismaClient();

try {
  const result = await seedInvestigationCatalog(prisma);
  if (result.skipped) {
    console.log("INVESTIGATION-CATALOG WARN model not present; no rows seeded");
  } else {
    console.log(`INVESTIGATION-CATALOG PASS upserted ${result.count} reference names`);
  }
} finally {
  await prisma.$disconnect();
}
