import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { Prisma, PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

function utcDateOnly(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function isUniqueViolation(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function main() {
  const schema = await import("node:fs/promises").then((fs) => fs.readFile("apps/api/prisma/schema.prisma", "utf8"));
  assert.match(schema, /queueDate\s+DateTime\s+@db\.Date/, "QueueTicket has queueDate date-only field");
  assert.match(schema, /@@unique\(\[branchId, queueDate, queueNumber\]\)/, "QueueTicket has daily uniqueness");
  assert.match(schema, /@@index\(\[branchId, queueDate, status\]\)/, "QueueTicket has daily status index");

  const branchA = await prisma.branch.create({
    data: { name: `Queue Date Test A ${runId}`, code: `QDA-${runId}` }
  });
  const branchB = await prisma.branch.create({
    data: { name: `Queue Date Test B ${runId}`, code: `QDB-${runId}` }
  });
  const patientA = await prisma.patient.create({
    data: {
      branchId: branchA.id,
      medicalRecordNumber: `QUEUE-DATE-A-${runId}`,
      firstName: "Demo",
      lastName: "QueueDate"
    }
  });
  const patientB = await prisma.patient.create({
    data: {
      branchId: branchB.id,
      medicalRecordNumber: `QUEUE-DATE-B-${runId}`,
      firstName: "Demo",
      lastName: "QueueDate"
    }
  });

  const dateOne = utcDateOnly(2026, 6, 3);
  const dateTwo = utcDateOnly(2026, 6, 4);

  try {
    await prisma.queueTicket.create({
      data: {
        branchId: branchA.id,
        patientId: patientA.id,
        queueNumber: 7,
        queueDate: dateOne,
        checkedInAt: new Date("2026-07-03T08:15:00.000Z")
      }
    });

    await assert.rejects(
      () =>
        prisma.queueTicket.create({
          data: {
            branchId: branchA.id,
            patientId: patientA.id,
            queueNumber: 7,
            queueDate: dateOne,
            checkedInAt: new Date("2026-07-03T09:15:00.000Z")
          }
        }),
      isUniqueViolation,
      "same branch, same queueDate, same queueNumber cannot duplicate"
    );

    await prisma.queueTicket.create({
      data: {
        branchId: branchA.id,
        patientId: patientA.id,
        queueNumber: 7,
        queueDate: dateTwo,
        checkedInAt: new Date("2026-07-04T08:15:00.000Z")
      }
    });

    await prisma.queueTicket.create({
      data: {
        branchId: branchB.id,
        patientId: patientB.id,
        queueNumber: 7,
        queueDate: dateOne,
        checkedInAt: new Date("2026-07-03T08:15:00.000Z")
      }
    });

    console.log("QUEUE-DATE PASS daily queue uniqueness constraints");
  } finally {
    await prisma.queueTicket.deleteMany({ where: { patientId: { in: [patientA.id, patientB.id] } } });
    await prisma.patient.deleteMany({ where: { id: { in: [patientA.id, patientB.id] } } });
    await prisma.branch.deleteMany({ where: { id: { in: [branchA.id, branchB.id] } } });
  }
}

main()
  .catch((error) => {
    console.error("QUEUE-DATE FAIL", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
