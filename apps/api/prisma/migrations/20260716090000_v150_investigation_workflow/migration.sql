ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'booking_required';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'booked';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'performed';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'needs_review';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'patient_informed';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'closed';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'not_completed';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'overdue';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'rejected_sample';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'correction_requested';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'amended';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'external_result_pending';

ALTER TABLE "InvestigationOrder"
  ADD COLUMN "internalExternal" TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN "templateVersion" INTEGER,
  ADD COLUMN "responsibilityJson" JSONB,
  ADD COLUMN "expectedResultDate" DATE,
  ADD COLUMN "lifecycleHistoryJson" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE "InvestigationOrderDraft" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "encounterId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "basketJson" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "InvestigationOrderDraft_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvestigationOrderDraft_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InvestigationOrderDraft_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InvestigationOrderDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "InvestigationOrderDraft_encounterId_userId_key" ON "InvestigationOrderDraft"("encounterId", "userId");
CREATE INDEX "InvestigationOrderDraft_patientId_encounterId_idx" ON "InvestigationOrderDraft"("patientId", "encounterId");
