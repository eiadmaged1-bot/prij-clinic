import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const dryRun = args.has("--dry-run") || !apply;
const safeApplyEnvs = new Set(["local", "dev", "development", "test"]);

function appEnv() {
  return (process.env.APP_ENV || "").trim().toLowerCase();
}

function assertSafeApplyEnv() {
  const env = appEnv();
  if (!safeApplyEnvs.has(env)) {
    throw new Error(`Refusing --apply with unsafe APP_ENV="${process.env.APP_ENV || ""}". Allowed: local, dev, development, test.`);
  }
}

function asDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function printGroup(prefix, group) {
  console.log(
    `${prefix} branch=${group.branchId} utcDate=${asDateString(group.queueDate)} queueNumber=${group.queueNumber} count=${group.count} ticketIds=${group.ticketIds.join(",")}`
  );
}

async function findDuplicateGroups(client) {
  return client.$queryRaw`
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

async function ticketsForGroup(client, group) {
  return client.$queryRaw`
    SELECT
      "id"::text AS "id",
      "patientId"::text AS "patientId",
      "appointmentId"::text AS "appointmentId",
      "queueNumber",
      "checkedInAt",
      "createdAt"
    FROM "QueueTicket"
    WHERE "branchId" = ${group.branchId}::uuid
      AND ("checkedInAt" AT TIME ZONE 'UTC')::date = ${asDateString(group.queueDate)}::date
      AND "queueNumber" = ${group.queueNumber}
    ORDER BY "checkedInAt" ASC, "createdAt" ASC, "id" ASC;
  `;
}

async function usedQueueNumbers(client, branchId, queueDate) {
  const rows = await client.$queryRaw`
    SELECT "queueNumber"
    FROM "QueueTicket"
    WHERE "branchId" = ${branchId}::uuid
      AND ("checkedInAt" AT TIME ZONE 'UTC')::date = ${asDateString(queueDate)}::date
    ORDER BY "queueNumber" ASC;
  `;
  return new Set(rows.map((row) => row.queueNumber));
}

function nextAvailable(used) {
  let candidate = Math.max(0, ...used) + 1;
  while (used.has(candidate)) candidate += 1;
  used.add(candidate);
  return candidate;
}

async function planRemediation(client, groups) {
  const plan = [];
  const usedByBranchDate = new Map();

  for (const group of groups) {
    const tickets = await ticketsForGroup(client, group);
    if (tickets.length <= 1) continue;

    const key = `${group.branchId}:${asDateString(group.queueDate)}`;
    let used = usedByBranchDate.get(key);
    if (!used) {
      used = await usedQueueNumbers(client, group.branchId, group.queueDate);
      usedByBranchDate.set(key, used);
    }

    const [keeper, ...duplicates] = tickets;
    plan.push({
      action: "keep",
      branchId: group.branchId,
      queueDate: asDateString(group.queueDate),
      ticketId: keeper.id,
      patientId: keeper.patientId,
      appointmentId: keeper.appointmentId,
      queueNumber: keeper.queueNumber,
      checkedInAt: keeper.checkedInAt
    });

    for (const ticket of duplicates) {
      const newQueueNumber = nextAvailable(used);
      plan.push({
        action: "renumber",
        branchId: group.branchId,
        queueDate: asDateString(group.queueDate),
        ticketId: ticket.id,
        patientId: ticket.patientId,
        appointmentId: ticket.appointmentId,
        oldQueueNumber: ticket.queueNumber,
        newQueueNumber,
        checkedInAt: ticket.checkedInAt
      });
    }
  }

  return plan;
}

async function applyPlan(tx, plan) {
  for (const item of plan.filter((entry) => entry.action === "renumber")) {
    await tx.$executeRaw`
      UPDATE "QueueTicket"
      SET "queueNumber" = ${item.newQueueNumber}
      WHERE "id" = ${item.ticketId}::uuid;
    `;
  }
}

async function main() {
  if (apply) assertSafeApplyEnv();

  const mode = apply ? "APPLY" : "DRY-RUN";
  console.log(`V109 LEGACY QUEUE DUPLICATE REMEDIATION ${mode}`);
  console.log(`APP_ENV=${process.env.APP_ENV || "not set"}`);

  const groups = await findDuplicateGroups(prisma);
  console.log(`duplicateGroups=${groups.length}`);
  for (const group of groups) printGroup("DUPLICATE", group);

  if (groups.length === 0) {
    console.log("No duplicate legacy queue groups found.");
    return;
  }

  const plan = await planRemediation(prisma, groups);
  for (const item of plan) {
    if (item.action === "keep") {
      console.log(`KEEP ticket=${item.ticketId} branch=${item.branchId} utcDate=${item.queueDate} queueNumber=${item.queueNumber}`);
    } else {
      console.log(
        `RENUMBER ticket=${item.ticketId} branch=${item.branchId} utcDate=${item.queueDate} oldQueueNumber=${item.oldQueueNumber} newQueueNumber=${item.newQueueNumber}`
      );
    }
  }

  if (dryRun) {
    console.log("Dry run only. Re-run with --apply and APP_ENV=local/dev/development/test to update queue numbers.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    const before = await findDuplicateGroups(tx);
    if (before.length !== groups.length) {
      throw new Error("Duplicate groups changed before apply. Re-run dry-run and review the new plan.");
    }

    await applyPlan(tx, plan);

    const after = await findDuplicateGroups(tx);
    if (after.length > 0) {
      for (const group of after) printGroup("REMAINING", group);
      throw new Error("Duplicate queue groups remain after remediation. Transaction rolled back.");
    }
  });

  console.log("APPLY PASS duplicate queue groups remediated without deleting tickets.");
}

main()
  .catch((error) => {
    console.error("V109 QUEUE DUPLICATE REMEDIATION FAIL", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
