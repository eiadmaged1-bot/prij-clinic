ALTER TABLE "DrugMarketSource"
  ADD COLUMN IF NOT EXISTS "sourcePolicyStatus" TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS "officialUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceAccessMode" TEXT NOT NULL DEFAULT 'public_or_upload',
  ADD COLUMN IF NOT EXISTS "importerKey" TEXT,
  ADD COLUMN IF NOT EXISTS "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastCheckedAt" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "lastSuccessfulImportAt" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "latestSourcePublishedAt" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "latestSourceLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceFreshnessStatus" TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS "coverageStatus" TEXT NOT NULL DEFAULT 'not_imported';

ALTER TABLE "DrugMarketProduct"
  ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "dataCompletenessScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "latestSourceFetchedAt" TIMESTAMPTZ(3);

ALTER TABLE "DrugMarketVariant"
  ADD COLUMN IF NOT EXISTS "officialPriceAmount" DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS "officialPriceText" TEXT,
  ADD COLUMN IF NOT EXISTS "priceEffectiveDate" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "priceSourceId" TEXT,
  ADD COLUMN IF NOT EXISTS "sourcePublishedAt" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "sourceFetchedAt" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "importRunId" UUID,
  ADD COLUMN IF NOT EXISTS "parserConfidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "officialRowJson" JSONB,
  ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "DrugMarketImportRowError"
  ADD COLUMN IF NOT EXISTS "severity" TEXT NOT NULL DEFAULT 'warning',
  ALTER COLUMN "rowNumber" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "rawRowJson" JSONB,
  ADD COLUMN IF NOT EXISTS "parserName" TEXT,
  ADD COLUMN IF NOT EXISTS "parserConfidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "suggestedAction" TEXT;

ALTER TABLE "DrugMarketImportRun"
  ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceFileName" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceFileSha256" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceFetchedAt" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "sourcePublishedAt" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "sourceLastModifiedHeader" TEXT,
  ADD COLUMN IF NOT EXISTS "parserName" TEXT,
  ADD COLUMN IF NOT EXISTS "parserVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "parserConfidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "totalRowsSeen" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "rowsImported" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "rowsNeedsReview" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "rowsSkipped" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "rowsFailed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sourceSnapshotJson" JSONB,
  ADD COLUMN IF NOT EXISTS "coverageJson" JSONB;

CREATE TABLE IF NOT EXISTS "OfficialMedicationSourceSnapshot" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sourceId" UUID,
  "countryCode" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceType" TEXT NOT NULL,
  "fetchedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourcePublishedAt" TIMESTAMPTZ(3),
  "lastModifiedHeader" TEXT,
  "fileName" TEXT,
  "fileSha256" TEXT,
  "rowCount" INTEGER,
  "importRunId" UUID,
  "status" TEXT NOT NULL DEFAULT 'captured',
  "metadataJson" JSONB,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfficialMedicationSourceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DrugMarketSource_sourceAccessMode_idx" ON "DrugMarketSource"("sourceAccessMode");
CREATE INDEX IF NOT EXISTS "DrugMarketSource_sourceFreshnessStatus_idx" ON "DrugMarketSource"("sourceFreshnessStatus");
CREATE INDEX IF NOT EXISTS "DrugMarketSource_coverageStatus_idx" ON "DrugMarketSource"("coverageStatus");
CREATE INDEX IF NOT EXISTS "DrugMarketProduct_isDemo_idx" ON "DrugMarketProduct"("isDemo");
CREATE INDEX IF NOT EXISTS "DrugMarketVariant_sourceFetchedAt_idx" ON "DrugMarketVariant"("sourceFetchedAt");
CREATE INDEX IF NOT EXISTS "DrugMarketVariant_sourcePublishedAt_idx" ON "DrugMarketVariant"("sourcePublishedAt");
CREATE INDEX IF NOT EXISTS "DrugMarketVariant_officialPriceAmount_idx" ON "DrugMarketVariant"("officialPriceAmount");
CREATE INDEX IF NOT EXISTS "DrugMarketVariant_currency_idx" ON "DrugMarketVariant"("currency");
CREATE INDEX IF NOT EXISTS "DrugMarketVariant_isDemo_idx" ON "DrugMarketVariant"("isDemo");
CREATE INDEX IF NOT EXISTS "DrugMarketImportRun_sourceFetchedAt_idx" ON "DrugMarketImportRun"("sourceFetchedAt");
CREATE INDEX IF NOT EXISTS "DrugMarketImportRun_sourcePublishedAt_idx" ON "DrugMarketImportRun"("sourcePublishedAt");
CREATE INDEX IF NOT EXISTS "DrugMarketImportRun_sourceFileSha256_idx" ON "DrugMarketImportRun"("sourceFileSha256");
CREATE INDEX IF NOT EXISTS "OfficialMedicationSourceSnapshot_sourceId_idx" ON "OfficialMedicationSourceSnapshot"("sourceId");
CREATE INDEX IF NOT EXISTS "OfficialMedicationSourceSnapshot_countryCode_idx" ON "OfficialMedicationSourceSnapshot"("countryCode");
CREATE INDEX IF NOT EXISTS "OfficialMedicationSourceSnapshot_fetchedAt_idx" ON "OfficialMedicationSourceSnapshot"("fetchedAt");
CREATE INDEX IF NOT EXISTS "OfficialMedicationSourceSnapshot_sourcePublishedAt_idx" ON "OfficialMedicationSourceSnapshot"("sourcePublishedAt");
CREATE INDEX IF NOT EXISTS "OfficialMedicationSourceSnapshot_fileSha256_idx" ON "OfficialMedicationSourceSnapshot"("fileSha256");
CREATE INDEX IF NOT EXISTS "OfficialMedicationSourceSnapshot_importRunId_idx" ON "OfficialMedicationSourceSnapshot"("importRunId");
CREATE INDEX IF NOT EXISTS "OfficialMedicationSourceSnapshot_status_idx" ON "OfficialMedicationSourceSnapshot"("status");
