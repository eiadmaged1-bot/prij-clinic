-- CreateEnum
CREATE TYPE "AiDraftStatus" AS ENUM ('draft', 'pending_doctor_review', 'doctor_edited', 'approved', 'rejected', 'expired', 'voided');

-- CreateEnum
CREATE TYPE "AiDraftType" AS ENUM ('encounter_summary', 'patient_instruction', 'report_summary', 'follow_up_message', 'administrative_message');

-- CreateTable
CREATE TABLE "AiDraft" (
    "id" UUID NOT NULL,
    "branchId" UUID,
    "patientId" UUID,
    "encounterId" UUID,
    "draftType" "AiDraftType" NOT NULL,
    "status" "AiDraftStatus" NOT NULL DEFAULT 'pending_doctor_review',
    "inputSourceSummary" TEXT,
    "generatedText" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL DEFAULT 'disabled_mock',
    "modelName" TEXT NOT NULL DEFAULT 'no_external_ai',
    "promptVersion" TEXT NOT NULL DEFAULT 'placeholder_v1',
    "requestedByUserId" UUID,
    "reviewedByUserId" UUID,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AiDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDraft_branchId_createdAt_idx" ON "AiDraft"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "AiDraft_patientId_createdAt_idx" ON "AiDraft"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "AiDraft_encounterId_idx" ON "AiDraft"("encounterId");

-- CreateIndex
CREATE INDEX "AiDraft_draftType_idx" ON "AiDraft"("draftType");

-- CreateIndex
CREATE INDEX "AiDraft_status_idx" ON "AiDraft"("status");

-- AddForeignKey
ALTER TABLE "AiDraft" ADD CONSTRAINT "AiDraft_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDraft" ADD CONSTRAINT "AiDraft_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDraft" ADD CONSTRAINT "AiDraft_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDraft" ADD CONSTRAINT "AiDraft_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDraft" ADD CONSTRAINT "AiDraft_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
