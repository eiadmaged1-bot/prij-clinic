import { randomUUID } from "node:crypto";
import { assertSafeApply, createPrisma } from "./v121-reference-utils.mjs";

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm") && process.argv.includes("ACTIVATE_REAL_OPERATIONAL_PATIENTS");
const prisma = createPrisma();
const reason = "Legacy inactive/archive status removed from normal clinic operations";

try {
  const candidates = await prisma.patient.findMany({
    where: { status: { in: ["inactive", "archived"] }, dataClassification: "REAL" },
    select: { id: true, branchId: true, status: true }
  });
  const byPreviousState = candidates.reduce((summary, patient) => {
    summary[patient.status] = (summary[patient.status] ?? 0) + 1;
    return summary;
  }, {});

  console.log(`V150-PATIENT-ACTIVATION mode=${apply ? "apply" : "dry-run"} eligible=${candidates.length} inactive=${byPreviousState.inactive ?? 0} archived=${byPreviousState.archived ?? 0}`);
  console.log("V150-PATIENT-ACTIVATION preserved classifications=TEST,NEEDS_REVIEW,QUARANTINED; no patient-linked records are deleted or rewritten");

  if (apply && candidates.length > 0) {
    assertSafeApply();
    if (!confirmed) throw new Error("Apply mode requires --confirm ACTIVATE_REAL_OPERATIONAL_PATIENTS.");
    const batchId = randomUUID();
    const appliedAt = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.createMany({
        data: candidates.map((patient) => ({
          action: "patient.operational_status_reconciled",
          resourceType: "patient",
          resourceId: patient.id,
          branchId: patient.branchId,
          severity: "high",
          reason,
          metadataJson: { batchId, previousState: patient.status, newState: "active", actor: "SYSTEM_RECONCILIATION", appliedAt: appliedAt.toISOString() }
        }))
      });
      await tx.patient.updateMany({
        where: { id: { in: candidates.map((patient) => patient.id) }, status: { in: ["inactive", "archived"] }, dataClassification: "REAL" },
        data: { status: "active" }
      });
    });
    console.log(`V150-PATIENT-ACTIVATION applied=${candidates.length} batchId=${batchId}`);
  }
} finally {
  await prisma.$disconnect();
}
