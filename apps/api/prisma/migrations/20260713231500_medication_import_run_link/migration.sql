-- Link import summaries to their run so unverified batches can be archived safely.
ALTER TABLE "DrugMarketImportJob" ADD COLUMN IF NOT EXISTS "importRunId" UUID;
CREATE INDEX IF NOT EXISTS "DrugMarketImportJob_importRunId_idx" ON "DrugMarketImportJob"("importRunId");
