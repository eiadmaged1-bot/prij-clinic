import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const dryRun = !apply || args.has("--dry-run");
const json = args.has("--json");
const allowedApplyEnvs = new Set(["local", "dev", "development", "test"]);

try {
  const envName = process.env.APP_ENV || process.env.NODE_ENV || "";
  if (apply) validateApplySafety(envName);

  const schema = await inspectSchema(prisma);
  assertQueueTicketShape(schema);

  const plan = await buildPlan(prisma, schema);
  printPlan(plan, { apply, dryRun, envName, json });

  if (!apply) {
    if (!json) console.log("DRY-RUN only. No mutation performed. Set APP_ENV=local and pass --apply to update duplicate rows.");
  } else {
    await prisma.$transaction(async (tx) => {
      for (const change of plan.changes) {
        await updateQueueTicket(tx, schema, change);
        await insertAuditLogIfSupported(tx, schema, change);
      }

      const remaining = await findDuplicateGroups(tx);
      if (remaining.length > 0) {
        throw new Error(`Queue duplicate remediation failed; ${remaining.length} duplicate group(s) remain.`);
      }
    });

    const finalGroups = await findDuplicateGroups(prisma);
    if (finalGroups.length > 0) {
      throw new Error(`Queue duplicate verification failed after commit; ${finalGroups.length} duplicate group(s) remain.`);
    }

    if (!json) {
      console.log(`APPLY complete. Updated ${plan.changes.length} ticket(s). Duplicate groups remaining: 0.`);
    }
  }
} catch (error) {
  console.error("V109 QUEUE DUPLICATE REMEDIATION FAIL", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

function validateApplySafety(envName) {
  if (!allowedApplyEnvs.has(envName)) {
    throw new Error(`Apply mode refused for APP_ENV/NODE_ENV=${envName || "(empty)"}. Allowed: local, dev, development, test.`);
  }
  if (["staging", "production", "prod"].includes(envName)) {
    throw new Error(`Apply mode refused for protected environment: ${envName}.`);
  }
  if (process.env.APP_ENV && ["staging", "production", "prod"].includes(process.env.APP_ENV)) {
    throw new Error(`Apply mode refused for APP_ENV=${process.env.APP_ENV}.`);
  }
  if (process.env.NODE_ENV && ["staging", "production", "prod"].includes(process.env.NODE_ENV)) {
    throw new Error(`Apply mode refused for NODE_ENV=${process.env.NODE_ENV}.`);
  }
}

async function inspectSchema(client) {
  const rows = await client.$queryRawUnsafe(`
    SELECT
      table_name AS "tableName",
      column_name AS "columnName",
      data_type AS "dataType",
      udt_name AS "udtName",
      is_nullable AS "isNullable",
      column_default AS "columnDefault"
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('QueueTicket', 'AuditLog')
    ORDER BY table_name, ordinal_position
  `);

  const tables = new Map();
  for (const row of rows) {
    if (!tables.has(row.tableName)) tables.set(row.tableName, new Map());
    tables.get(row.tableName).set(row.columnName, row);
  }
  return tables;
}

function assertQueueTicketShape(schema) {
  const table = schema.get("QueueTicket");
  if (!table) throw new Error('Expected table "QueueTicket" was not found in public schema.');
  for (const column of ["id", "branchId", "queueNumber", "checkedInAt"]) {
    if (!table.has(column)) throw new Error(`Expected QueueTicket.${column} was not found in local DB schema.`);
  }
}

async function buildPlan(client, schema) {
  const duplicateGroups = await findDuplicateGroups(client);
  const affectedDays = uniqueAffectedDays(duplicateGroups);
  const changes = [];
  const groupPlans = [];

  for (const day of affectedDays) {
    const tickets = await findTicketsForBranchDate(client, schema, day.branchId, day.utcDate);
    const byQueueNumber = groupBy(tickets, (ticket) => String(ticket.queueNumber));
    const used = new Set();
    const changedTickets = [];

    for (const [queueNumber, rows] of [...byQueueNumber.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
      const sorted = sortTickets(rows, schema);
      if (sorted.length === 1) {
        used.add(Number(queueNumber));
        continue;
      }

      const kept = sorted[0];
      used.add(Number(queueNumber));
      const groupChanges = [];
      for (const ticket of sorted.slice(1)) {
        changedTickets.push({ ticket, oldQueueNumber: Number(queueNumber), groupQueueNumber: Number(queueNumber), keptId: kept.id, groupChanges });
      }

      groupPlans.push({
        branchId: day.branchId,
        utcDate: day.utcDate,
        queueNumber: Number(queueNumber),
        keptTicketId: kept.id,
        changed: groupChanges
      });
    }

    for (const item of changedTickets.sort((a, b) => a.groupQueueNumber - b.groupQueueNumber || compareTickets(a.ticket, b.ticket, schema))) {
      const newQueueNumber = nextAvailablePositiveInteger(used);
      used.add(newQueueNumber);
      const change = {
        ticketId: item.ticket.id,
        branchId: day.branchId,
        utcDate: day.utcDate,
        oldQueueNumber: item.oldQueueNumber,
        newQueueNumber,
        keptTicketId: item.keptId
      };
      changes.push(change);
      item.groupChanges.push(change);
    }
  }

  return { duplicateGroups, groupPlans, changes };
}

async function findDuplicateGroups(client) {
  return client.$queryRawUnsafe(`
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

async function findTicketsForBranchDate(client, schema, branchId, utcDate) {
  const queueColumns = schema.get("QueueTicket");
  const createdAtSelect = queueColumns.has("createdAt") ? ', "createdAt" AS "createdAt"' : ', NULL AS "createdAt"';
  const rows = await client.$queryRawUnsafe(
    `
      SELECT
        "id"::text AS "id",
        "branchId"::text AS "branchId",
        "queueNumber" AS "queueNumber",
        "checkedInAt" AS "checkedInAt"
        ${createdAtSelect}
      FROM "QueueTicket"
      WHERE "branchId" = $1::uuid
        AND ("checkedInAt" AT TIME ZONE 'UTC')::date = $2::date
      ORDER BY "queueNumber" ASC, "checkedInAt" ASC NULLS LAST, "createdAt" ASC NULLS LAST, "id" ASC
    `,
    branchId,
    utcDate
  );
  return rows;
}

async function updateQueueTicket(client, schema, change) {
  const queueColumns = schema.get("QueueTicket");
  const updatedAtSet = queueColumns.has("updatedAt") ? ', "updatedAt" = NOW()' : "";
  await client.$executeRawUnsafe(
    `
      UPDATE "QueueTicket"
      SET "queueNumber" = $1
        ${updatedAtSet}
      WHERE "id" = $2::uuid
        AND "branchId" = $3::uuid
        AND "queueNumber" = $4
        AND ("checkedInAt" AT TIME ZONE 'UTC')::date = $5::date
    `,
    change.newQueueNumber,
    change.ticketId,
    change.branchId,
    change.oldQueueNumber,
    change.utcDate
  );
}

async function insertAuditLogIfSupported(client, schema, change) {
  const auditColumns = schema.get("AuditLog");
  if (!auditColumns) return;
  const required = ["action", "resourceType", "resourceId", "metadataJson", "branchId", "severity", "reason"];
  if (!required.every((column) => auditColumns.has(column))) return;
  const idColumn = auditColumns.get("id");
  if (idColumn && !idColumn.columnDefault) {
    console.warn(`WARN audit insert skipped for QueueTicket ${change.ticketId}: AuditLog.id has no database default in this local schema.`);
    return;
  }

  const details = {
    oldQueueNumber: change.oldQueueNumber,
    newQueueNumber: change.newQueueNumber,
    branchId: change.branchId,
    utcDate: change.utcDate,
    reason: "pre-queueDate-unique-migration-remediation"
  };

  try {
    await client.$executeRawUnsafe(
      `
        INSERT INTO "AuditLog" ("action", "resourceType", "resourceId", "metadataJson", "branchId", "severity", "reason")
        VALUES (
          'queue.legacy_duplicate_resolved',
          'QueueTicket',
          $1::uuid,
          $2::jsonb,
          $3::uuid,
          'medium',
          'pre-queueDate-unique-migration-remediation'
        )
      `,
      change.ticketId,
      JSON.stringify(details),
      change.branchId
    );
  } catch (error) {
    console.warn(`WARN audit insert skipped for QueueTicket ${change.ticketId}: ${error instanceof Error ? error.message : error}`);
  }
}

function uniqueAffectedDays(groups) {
  const byKey = new Map();
  for (const group of groups) {
    byKey.set(`${group.branchId}|${group.utcDate}`, { branchId: group.branchId, utcDate: group.utcDate });
  }
  return [...byKey.values()].sort((a, b) => a.branchId.localeCompare(b.branchId) || a.utcDate.localeCompare(b.utcDate));
}

function groupBy(items, keyFn) {
  const result = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(item);
  }
  return result;
}

function sortTickets(rows, schema) {
  return [...rows].sort((a, b) => compareTickets(a, b, schema));
}

function compareTickets(a, b, schema) {
  const checked = compareNullableDates(a.checkedInAt, b.checkedInAt);
  if (checked !== 0) return checked;
  if (schema.get("QueueTicket").has("createdAt")) {
    const created = compareNullableDates(a.createdAt, b.createdAt);
    if (created !== 0) return created;
  }
  return a.id.localeCompare(b.id);
}

function compareNullableDates(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}

function nextAvailablePositiveInteger(used) {
  let candidate = 1;
  while (used.has(candidate)) candidate += 1;
  return candidate;
}

function printPlan(plan, options) {
  if (options.json) {
    console.log(JSON.stringify({ mode: options.apply ? "apply" : "dry-run", ...plan }, null, 2));
    return;
  }

  console.log(`V109 LEGACY QUEUE DUPLICATE REMEDIATION ${options.apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`APP_ENV/NODE_ENV=${options.envName || "(empty)"}`);
  console.log(`duplicate groups: ${plan.duplicateGroups.length}`);
  console.log(`planned ticket updates: ${plan.changes.length}`);

  for (const group of plan.groupPlans) {
    console.log(`group branch=${group.branchId} utcDate=${group.utcDate} queueNumber=${group.queueNumber}`);
    console.log(`  keep ticket=${group.keptTicketId}`);
    for (const change of group.changed) {
      console.log(`  ${options.apply ? "update" : "would update"} ticket=${change.ticketId} oldQueueNumber=${change.oldQueueNumber} newQueueNumber=${change.newQueueNumber}`);
    }
  }
}
