import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();

async function duplicateQueueGroups() {
  return prisma.$queryRaw`
    SELECT
      "branchId"::text AS "branchId",
      (("checkedInAt" AT TIME ZONE 'UTC')::date)::text AS "queueDate",
      "queueNumber",
      COUNT(*)::int AS "count",
      ARRAY_AGG("id"::text ORDER BY "checkedInAt" ASC, "createdAt" ASC, "id" ASC) AS "ticketIds"
    FROM "QueueTicket"
    GROUP BY "branchId", ("checkedInAt" AT TIME ZONE 'UTC')::date, "queueNumber"
    HAVING COUNT(*) > 1
    ORDER BY "branchId", "queueDate", "queueNumber";
  `;
}

async function encountersWithoutPatientBranch() {
  return prisma.$queryRaw`
    SELECT e."id"::text AS "encounterId", e."patientId"::text AS "patientId"
    FROM "Encounter" e
    LEFT JOIN "Patient" p ON p."id" = e."patientId"
    WHERE p."id" IS NULL OR p."branchId" IS NULL
    ORDER BY e."createdAt" ASC, e."id" ASC;
  `;
}

async function main() {
  console.log("V109 QUEUE DATE MIGRATION READINESS");
  console.log(`APP_ENV=${process.env.APP_ENV || "not set"}`);

  const duplicates = await duplicateQueueGroups();
  const encounterBranchBackfillBlockers = await encountersWithoutPatientBranch();

  console.log(`duplicateQueueGroups=${duplicates.length}`);
  for (const group of duplicates) {
    console.log(
      `DUPLICATE branch=${group.branchId} utcDate=${String(group.queueDate).slice(0, 10)} queueNumber=${group.queueNumber} count=${group.count} ticketIds=${group.ticketIds.join(",")}`
    );
  }

  console.log(`encounterBranchBackfillBlockers=${encounterBranchBackfillBlockers.length}`);
  for (const row of encounterBranchBackfillBlockers) {
    console.log(`ENCOUNTER_BRANCH_BLOCKER encounter=${row.encounterId} patient=${row.patientId}`);
  }

  if (duplicates.length > 0 || encounterBranchBackfillBlockers.length > 0) {
    throw new Error("Migration readiness failed. Resolve duplicate queue groups and encounter patient branch blockers before deploy.");
  }

  console.log("MIGRATION-READY PASS queue date uniqueness and encounter branch backfill prerequisites are satisfied.");
}

main()
  .catch((error) => {
    console.error("V109 QUEUE DATE MIGRATION READINESS FAIL", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
