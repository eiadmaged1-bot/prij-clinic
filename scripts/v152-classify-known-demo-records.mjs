import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const actorLogin = process.env.V152_CLASSIFICATION_ACTOR || "eyad";
const batchId = process.env.V152_CLASSIFICATION_BATCH || `v152-known-demo-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const reason = `Known deterministic repository test artifacts; exact seeded identities or reserved automated-test MRN prefixes only; batch ${batchId}`;

const exactSeedIdentity = {
  OR: [
    { medicalRecordNumber: { startsWith: "DEMO-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "QA-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "UX-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "TEST-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "LOCAL-WF-", mode: "insensitive" } },
    { firstName: { equals: "Demo", mode: "insensitive" }, lastName: { in: ["Route", "Workflow", "Clinical"], mode: "insensitive" } },
    { firstName: { equals: "Test", mode: "insensitive" }, lastName: { equals: "Intake Only", mode: "insensitive" } },
    { firstName: { in: ["Demo Route", "Demo Workflow", "Demo Clinical", "Test Intake Only"], mode: "insensitive" } }
  ]
};

try {
  const actor = await prisma.user.findFirst({ where: { loginId: actorLogin, status: "active", userRoles: { some: { role: { name: "Owner" } } } }, select: { id: true } });
  if (!actor) throw new Error("An active Owner actor is required for the classification batch.");
  const patients = await prisma.patient.findMany({ where: { dataClassification: "REAL", ...exactSeedIdentity }, select: { id: true, branchId: true } });
  const patientIds = patients.map((patient) => patient.id);
  const scans = patientIds.length ? await prisma.obUltrasound.findMany({ where: { patientId: { in: patientIds }, dataClassification: "REAL" }, select: { id: true, branchId: true } }) : [];
  const summary = { mode: apply ? "apply" : "dry-run", batchId, patientCandidates: patients.length, ultrasoundCandidates: scans.length, deletes: 0 };
  if (!apply) {
    console.log(JSON.stringify(summary));
    process.exit(0);
  }
  await prisma.$transaction(async (tx) => {
    if (patientIds.length) await tx.patient.updateMany({ where: { id: { in: patientIds }, dataClassification: "REAL" }, data: { dataClassification: "TEST", classificationReason: reason, classifiedAt: new Date(), classifiedByUserId: actor.id } });
    if (scans.length) await tx.obUltrasound.updateMany({ where: { id: { in: scans.map((scan) => scan.id) }, dataClassification: "REAL" }, data: { dataClassification: "TEST", classificationReason: reason, classifiedAt: new Date(), classifiedByUserId: actor.id } });
    if (patients.length) await tx.auditLog.createMany({ data: patients.map((patient) => ({ actorUserId: actor.id, action: "data_classification.changed", resourceType: "patient", resourceId: patient.id, branchId: patient.branchId, severity: "high", reason, metadataJson: { batchId, beforeClassification: "REAL", afterClassification: "TEST", evidence: "deterministic_repository_test_identifier" } })) });
    if (scans.length) await tx.auditLog.createMany({ data: scans.map((scan) => ({ actorUserId: actor.id, action: "data_classification.changed", resourceType: "ultrasound", resourceId: scan.id, branchId: scan.branchId, severity: "high", reason, metadataJson: { batchId, beforeClassification: "REAL", afterClassification: "TEST", evidence: "linked_to_exact_repository_seed_patient" } })) });
    await tx.auditLog.create({ data: { actorUserId: actor.id, action: "data_classification.batch_completed", resourceType: "data_hygiene_batch", severity: "high", reason, metadataJson: summary } });
  }, { timeout: 120_000 });
  const remaining = await prisma.patient.count({ where: { dataClassification: "REAL", ...exactSeedIdentity } });
  console.log(JSON.stringify({ ...summary, remainingEligible: remaining, audited: patients.length + scans.length + 1 }));
} finally {
  await prisma.$disconnect();
}
