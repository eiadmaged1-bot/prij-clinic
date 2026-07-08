import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const demoServiceWhere = {
  OR: [
    { name: { in: ["Demo active finance service", "Demo admin service", "Demo finance consultation", "Demo lab panel"], mode: "insensitive" } },
    { code: { startsWith: "DEMO-SVC-", mode: "insensitive" } },
    { code: { startsWith: "FIN-ACT-", mode: "insensitive" } },
    { code: { startsWith: "FIN-", mode: "insensitive" } },
    { code: { equals: "LAB-PANEL-DEMO", mode: "insensitive" } }
  ]
};

const demoUserWhere = {
  protectedAccount: false,
  OR: [
    { displayName: { in: ["Runtime Doctor", "Runtime Nurse", "Runtime Receptionist", "Runtime Accountant"], mode: "insensitive" } },
    { email: { in: ["runtime.doctor@prij.local", "runtime.nurse@prij.local", "runtime.reception@prij.local", "runtime.accountant@prij.local"], mode: "insensitive" } },
    { displayName: { startsWith: "Demo ", mode: "insensitive" } },
    { displayName: { startsWith: "Test ", mode: "insensitive" } },
    { email: { startsWith: "demo.", mode: "insensitive" } },
    { email: { startsWith: "test", mode: "insensitive" } }
  ]
};

const demoPatientWhere = {
  OR: [
    { medicalRecordNumber: { startsWith: "DEMO-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "TEST-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "LOCAL-WF-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "STAGE-SMOKE-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "LOCAL-PAT-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "QA-", mode: "insensitive" } },
    { firstName: { startsWith: "Test Intake", mode: "insensitive" } },
    { firstName: { equals: "Demo", mode: "insensitive" } },
    { lastName: { contains: "Demo", mode: "insensitive" } },
    { notes: { contains: "Fake local", mode: "insensitive" } },
    { notes: { contains: "demo patient", mode: "insensitive" } },
    { notes: { contains: "demo workflow", mode: "insensitive" } },
    { notes: { contains: "test only", mode: "insensitive" } }
  ]
};

const demoTextTerms = [
  "Demo Route",
  "demo route",
  "QA Route",
  "Runtime Route",
  "Test Route",
  "Demo appointment",
  "QA appointment",
  "Runtime appointment",
  "Test appointment"
];

const demoGuidelineSourceWhere = {
  active: true,
  OR: demoTextTerms.flatMap((term) => [
    { name: { contains: term, mode: "insensitive" } },
    { organization: { contains: term, mode: "insensitive" } },
    { notes: { contains: term, mode: "insensitive" } }
  ])
};

const demoAppointmentWhere = {
  OR: demoTextTerms.flatMap((term) => [
    { appointmentType: { contains: term, mode: "insensitive" } },
    { source: { contains: term, mode: "insensitive" } },
    { notes: { contains: term, mode: "insensitive" } }
  ])
};

function printSummary(summary) {
  console.log(`Demo data cleanup ${apply ? "apply" : "dry-run"}`);
  for (const [key, value] of Object.entries(summary)) {
    console.log(`${key}: ${value}`);
  }
}

async function collectSummary() {
  const demoServices = await prisma.serviceItem.findMany({ where: demoServiceWhere, select: { id: true } });
  const demoServiceIds = demoServices.map((service) => service.id);
  const referencedServiceIds = demoServiceIds.length
    ? new Set((await prisma.invoiceItem.findMany({ where: { serviceItemId: { in: demoServiceIds } }, select: { serviceItemId: true } })).map((item) => item.serviceItemId).filter(Boolean))
    : new Set();
  const demoPatients = await prisma.patient.findMany({ where: demoPatientWhere, select: { id: true, status: true } });
  const demoPatientIds = demoPatients.map((patient) => patient.id);
  const activeDemoPatientIds = demoPatients.filter((patient) => patient.status !== "archived").map((patient) => patient.id);

  return {
    demoServiceIds,
    referencedServiceIds,
    demoPatientIds,
    activeDemoPatientIds,
    servicesDeleted: demoServiceIds.filter((id) => !referencedServiceIds.has(id)).length,
    servicesArchived: referencedServiceIds.size,
    usersDeleted: await prisma.user.count({ where: demoUserWhere }),
    guidelineSourcesArchived: await prisma.guidelineSource.count({ where: demoGuidelineSourceWhere }),
    appointmentsSanitized: await prisma.appointment.count({ where: demoAppointmentWhere }),
    patientsArchived: activeDemoPatientIds.length,
    queueRecordsRemoved: demoPatientIds.length ? await prisma.queueTicket.count({ where: { patientId: { in: demoPatientIds }, status: { in: ["waiting", "called"] } } }) : 0,
    intakeSubmissionsRemoved: demoPatientIds.length ? await prisma.patientIntake.count({ where: { patientId: { in: demoPatientIds }, status: { not: "signed_locked" } } }) : 0,
    financeRecordsRemoved: demoPatientIds.length ? await prisma.invoice.count({ where: { patientId: { in: demoPatientIds }, status: { in: ["draft", "issued"] } } }) : 0,
    skippedSignedClinicalRecords: demoPatientIds.length
      ? (await prisma.encounter.count({ where: { patientId: { in: demoPatientIds }, status: "signed" } })) +
        (await prisma.prescription.count({ where: { patientId: { in: demoPatientIds }, status: "signed" } })) +
        (await prisma.patientIntake.count({ where: { patientId: { in: demoPatientIds }, status: "signed_locked" } }))
      : 0
  };
}

async function applyCleanup(summary) {
  const unreferencedServiceIds = summary.demoServiceIds.filter((id) => !summary.referencedServiceIds.has(id));
  const referencedServiceIds = summary.demoServiceIds.filter((id) => summary.referencedServiceIds.has(id));

  await prisma.$transaction(async (tx) => {
    if (unreferencedServiceIds.length) {
      await tx.serviceItem.deleteMany({ where: { id: { in: unreferencedServiceIds } } });
    }
    if (referencedServiceIds.length) {
      await tx.serviceItem.updateMany({
        where: { id: { in: referencedServiceIds } },
        data: { active: false, reviewStatus: "archived_demo" }
      });
    }
    await tx.queueTicket.updateMany({
      where: { patientId: { in: summary.demoPatientIds }, status: { in: ["waiting", "called"] } },
      data: { status: "cancelled", cancelledAt: new Date(), cancellationReason: "v1.3.9 deterministic demo/test cleanup" }
    });
    await tx.patientIntake.deleteMany({
      where: { patientId: { in: summary.demoPatientIds }, status: { not: "signed_locked" } }
    });
    await tx.invoice.updateMany({
      where: { patientId: { in: summary.demoPatientIds }, status: { in: ["draft", "issued"] } },
      data: { status: "voided", voidedAt: new Date(), voidReason: "v1.3.9 deterministic demo/test cleanup" }
    });
    await tx.patient.updateMany({
      where: { id: { in: summary.activeDemoPatientIds } },
      data: { status: "archived" }
    });
    await tx.guidelineSource.updateMany({
      where: demoGuidelineSourceWhere,
      data: { active: false }
    });
    await tx.appointment.updateMany({
      where: demoAppointmentWhere,
      data: {
        appointmentType: "Archived fixture",
        status: "cancelled",
        notes: null,
        cancellationReason: "v1.4 demo/test appointment cleanup"
      }
    });
    await tx.userRole.deleteMany({ where: { user: demoUserWhere } });
    await tx.userPermissionOverride.deleteMany({ where: { user: demoUserWhere } });
    await tx.user.deleteMany({ where: demoUserWhere });
  });
}

try {
  const summary = await collectSummary();
  printSummary({
    servicesDeleted: summary.servicesDeleted,
    servicesArchived: summary.servicesArchived,
    usersDeleted: summary.usersDeleted,
    guidelineSourcesArchived: summary.guidelineSourcesArchived,
    appointmentsSanitized: summary.appointmentsSanitized,
    patientsArchived: summary.patientsArchived,
    queueRecordsRemoved: summary.queueRecordsRemoved,
    intakeSubmissionsRemoved: summary.intakeSubmissionsRemoved,
    financeRecordsRemoved: summary.financeRecordsRemoved,
    skippedRecordsDueToSafety: summary.skippedSignedClinicalRecords
  });
  if (apply) {
    await applyCleanup(summary);
    console.log("Cleanup applied.");
  }
} finally {
  await prisma.$disconnect();
}
