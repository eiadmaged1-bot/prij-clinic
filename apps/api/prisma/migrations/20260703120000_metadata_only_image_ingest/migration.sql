-- Metadata-only image ingest and EXIF stripping metadata.
ALTER TYPE "PatientDocumentStorageMode" ADD VALUE IF NOT EXISTS 'production_external_storage_placeholder';

ALTER TABLE "PatientDocument"
  ADD COLUMN "originalFileName" TEXT,
  ADD COLUMN "displayFileName" TEXT,
  ADD COLUMN "imageWidth" INTEGER,
  ADD COLUMN "imageHeight" INTEGER,
  ADD COLUMN "sanitizedSha256" TEXT,
  ADD COLUMN "originalSha256Internal" TEXT,
  ADD COLUMN "exifStripped" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "metadataSanitizedAt" TIMESTAMPTZ(3),
  ADD COLUMN "localDemoFilePath" TEXT,
  ADD COLUMN "ingestWarnings" JSONB;

CREATE INDEX "PatientDocument_sanitizedSha256_idx" ON "PatientDocument"("sanitizedSha256");
