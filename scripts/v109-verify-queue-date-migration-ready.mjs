import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();

try {
  await assertQueueTicketShape();
  const groups = await findDuplicateGroups();
  if (groups.length === 0) {
    console.log("V109 QUEUE MIGRATION READY PASS duplicate groups: 0");
  } else {
    console.error(`V109 QUEUE MIGRATION READY FAIL duplicate groups: ${groups.length}`);
    for (const group of groups) {
      console.error(`branch=${group.branchId} utcDate=${group.utcDate} queueNumber=${group.queueNumber} tickets=${group.ticketCount}`);
    }
    process.exitCode = 1;
  }
} catch (error) {
  console.error("V109 QUEUE MIGRATION READY FAIL", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

async function assertQueueTicketShape() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT column_name AS "columnName"
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'QueueTicket'
      AND column_name IN ('id', 'branchId', 'queueNumber', 'checkedInAt')
  `);
  const columns = new Set(rows.map((row) => row.columnName));
  for (const column of ["id", "branchId", "queueNumber", "checkedInAt"]) {
    if (!columns.has(column)) throw new Error(`Expected QueueTicket.${column} was not found in local DB schema.`);
  }
}

async function findDuplicateGroups() {
  return prisma.$queryRawUnsafe(`
    SELECT
      "branchId"::text AS "branchId",
      (("checkedInAt" AT TIME ZONE 'UTC')::date)::text AS "utcDate",
      "queueNumber" AS "queueNumber",
      COUNT(*)::int AS "ticketCount"
    FROM "QueueTicket"
    GROUP BY "branchId", ("checkedInAt" AT TIME ZONE 'UTC')::date, "queueNumber"
    HAVING COUNT(*) > 1
    ORDER BY "branchId", (("checkedInAt" AT TIME ZONE 'UTC')::date)::text, "queueNumber"
  `);
}
