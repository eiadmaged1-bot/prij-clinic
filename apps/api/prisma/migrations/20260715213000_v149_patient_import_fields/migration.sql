ALTER TABLE "Patient"
ADD COLUMN "address" TEXT,
ADD COLUMN "spouseName" TEXT,
ADD COLUMN "secondaryPhone" TEXT,
ADD COLUMN "externalFileNumber" TEXT,
ADD COLUMN "originalRegistrationDate" DATE,
ADD COLUMN "importSource" TEXT,
ADD COLUMN "importBatchId" UUID,
ADD COLUMN "dataVerificationState" TEXT NOT NULL DEFAULT 'VERIFIED',
ADD COLUMN "validationWarnings" JSONB,
ADD COLUMN "originalSourceMetadata" JSONB;

ALTER TABLE "PatientImportRow"
ADD COLUMN "decision" TEXT NOT NULL DEFAULT 'CONFIRM_CREATE',
ADD COLUMN "selected" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "decisionReason" TEXT,
ADD COLUMN "reviewerUpdatedAt" TIMESTAMPTZ(3);

ALTER TABLE "Patient" ADD CONSTRAINT "Patient_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "PatientImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Patient_externalFileNumber_idx" ON "Patient"("externalFileNumber");
CREATE INDEX "Patient_importBatchId_idx" ON "Patient"("importBatchId");
CREATE INDEX "Patient_dataVerificationState_idx" ON "Patient"("dataVerificationState");
