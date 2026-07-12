-- Forward-only patient document security metadata. Existing document records
-- remain readable as legacy metadata; no filesystem paths are migrated.
CREATE TYPE "DocumentScanStatus" AS ENUM ('PENDING', 'CLEAN', 'REJECTED', 'ERROR', 'NOT_CONFIGURED');
CREATE TYPE "DocumentQuarantineStatus" AS ENUM ('QUARANTINED', 'PROMOTED', 'REJECTED', 'ORPHANED');
ALTER TYPE "PatientDocumentStorageMode" ADD VALUE 'secure_encrypted_local';

ALTER TABLE "PatientDocument"
ADD COLUMN "storageKey" TEXT,
ADD COLUMN "originalFilenameSafe" TEXT,
ADD COLUMN "detectedMimeType" TEXT,
ADD COLUMN "declaredMimeType" TEXT,
ADD COLUMN "sha256" TEXT,
ADD COLUMN "encryptionVersion" INTEGER,
ADD COLUMN "encryptionKeyId" TEXT,
ADD COLUMN "scanStatus" "DocumentScanStatus",
ADD COLUMN "scanProvider" TEXT,
ADD COLUMN "scanCompletedAt" TIMESTAMPTZ(3),
ADD COLUMN "quarantineStatus" "DocumentQuarantineStatus",
ADD COLUMN "createdRequestId" TEXT;

CREATE INDEX "PatientDocument_storageKey_idx" ON "PatientDocument"("storageKey");
CREATE INDEX "PatientDocument_patientId_sha256_idx" ON "PatientDocument"("patientId", "sha256");
CREATE INDEX "PatientDocument_quarantineStatus_createdAt_idx" ON "PatientDocument"("quarantineStatus", "createdAt");
CREATE INDEX "PatientDocument_scanStatus_createdAt_idx" ON "PatientDocument"("scanStatus", "createdAt");
