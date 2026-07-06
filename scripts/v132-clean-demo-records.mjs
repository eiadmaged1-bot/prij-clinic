import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const demoPatientWhere = {
  OR: [
    { firstName: { startsWith: "Demo", mode: "insensitive" } },
    { lastName: { startsWith: "Demo", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "DEMO-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "TEST-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "QA-", mode: "insensitive" } },
    { notes: { contains: "local demo", mode: "insensitive" } },
    { notes: { contains: "training", mode: "insensitive" } }
  ]
};

try {
  const patients = await prisma.patient.findMany({
    where: demoPatientWhere,
    select: { id: true, medicalRecordNumber: true, firstName: true, lastName: true, status: true }
  });
  const patientIds = patients.map((patient) => patient.id);
  const activeQueueCount = patientIds.length
    ? await prisma.queueTicket.count({ where: { patientId: { in: patientIds }, status: { in: ["waiting", "called"] } } })
    : 0;

  console.log(`Demo cleanup ${apply ? "apply" : "dry-run"}`);
  console.log(`Matched patients: ${patients.length}`);
  console.log(`Active queue tickets to cancel: ${activeQueueCount}`);

  for (const patient of patients.slice(0, 20)) {
    console.log(`- ${patient.medicalRecordNumber ?? patient.id}: ${[patient.firstName, patient.lastName].filter(Boolean).join(" ")} (${patient.status})`);
  }

  if (!apply || patientIds.length === 0) {
    process.exit(0);
  }

  await prisma.$transaction([
    prisma.queueTicket.updateMany({
      where: { patientId: { in: patientIds }, status: { in: ["waiting", "called"] } },
      data: { status: "cancelled", cancelledAt: new Date(), cancellationReason: "v1.3.2 demo/test cleanup quarantine" }
    }),
    prisma.patient.updateMany({
      where: { id: { in: patientIds } },
      data: { status: "archived" }
    })
  ]);

  console.log("Demo cleanup applied.");
} finally {
  await prisma.$disconnect();
}
