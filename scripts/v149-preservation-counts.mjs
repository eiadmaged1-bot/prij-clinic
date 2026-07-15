import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const prisma = new PrismaClient();
const tables = ["Patient", "Encounter", "QueueTicket", "GuidelineDocument", "ClinicalProtocol", "ObUltrasound", "ExternalPatientSubmission", "InvestigationOrder", "InvestigationResult", "Prescription", "MedicationGeneric"];
const classifiedTables = ["Patient", "ExternalPatientSubmission", "ObUltrasound", "Encounter", "QueueTicket"];

try {
  const counts = {};
  for (const table of tables) {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    counts[table] = rows[0]?.count ?? 0;
  }
  const classifications = {};
  for (const table of classifiedTables) {
    const exists = await prisma.$queryRawUnsafe(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = 'dataClassification') AS present`);
    if (!exists[0]?.present) { classifications[table] = { NOT_MIGRATED: counts[table] ?? 0 }; continue; }
    const rows = await prisma.$queryRawUnsafe(`SELECT "dataClassification"::text AS classification, COUNT(*)::int AS count FROM "${table}" GROUP BY "dataClassification" ORDER BY "dataClassification"`);
    classifications[table] = Object.fromEntries(rows.map((row) => [row.classification, row.count]));
  }
  console.log(JSON.stringify({ capturedAt: new Date().toISOString(), counts, classifications }, null, 2));
} finally {
  await prisma.$disconnect();
}
