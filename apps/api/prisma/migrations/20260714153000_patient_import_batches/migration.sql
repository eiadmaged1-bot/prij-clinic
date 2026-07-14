CREATE TABLE "PatientImportBatch" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "fileName" TEXT NOT NULL, "fileHash" TEXT NOT NULL,
  "fileType" TEXT NOT NULL, "encoding" TEXT, "status" TEXT NOT NULL DEFAULT 'previewed', "mappingJson" JSONB NOT NULL,
  "rowCount" INTEGER NOT NULL DEFAULT 0, "importedCount" INTEGER NOT NULL DEFAULT 0, "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0, "createdByUserId" UUID NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(3), CONSTRAINT "PatientImportBatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PatientImportBatch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "PatientImportRow" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "batchId" UUID NOT NULL, "rowNumber" INTEGER NOT NULL, "status" TEXT NOT NULL,
  "normalizedJson" JSONB NOT NULL, "warningsJson" JSONB, "duplicateJson" JSONB, "createdPatientId" UUID, "errorCode" TEXT,
  "importedAt" TIMESTAMPTZ(3), CONSTRAINT "PatientImportRow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PatientImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PatientImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PatientImportRow_createdPatientId_fkey" FOREIGN KEY ("createdPatientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "PatientImportBatch_createdByUserId_createdAt_idx" ON "PatientImportBatch"("createdByUserId", "createdAt");
CREATE INDEX "PatientImportBatch_fileHash_idx" ON "PatientImportBatch"("fileHash");
CREATE INDEX "PatientImportBatch_status_idx" ON "PatientImportBatch"("status");
CREATE UNIQUE INDEX "PatientImportRow_batchId_rowNumber_key" ON "PatientImportRow"("batchId", "rowNumber");
CREATE INDEX "PatientImportRow_status_idx" ON "PatientImportRow"("status");
CREATE INDEX "PatientImportRow_createdPatientId_idx" ON "PatientImportRow"("createdPatientId");
