ALTER TABLE "MedicationSafetyProfile"
  ADD COLUMN "lastCheckedAt" TIMESTAMPTZ(3),
  ADD COLUMN "sourceLastUpdatedAt" TIMESTAMPTZ(3),
  ADD COLUMN "sourceVersionLabel" TEXT,
  ADD COLUMN "sourceRefreshStatus" TEXT DEFAULT 'UNKNOWN',
  ADD COLUMN "sourceRefreshNote" TEXT;

UPDATE "MedicationSafetyProfile"
SET
  "sourceRefreshStatus" = CASE
    WHEN "reviewStatus" = 'reviewed' AND "sourceType" <> 'not_reviewed' THEN 'UNKNOWN'
    ELSE 'REVIEW_REQUIRED'
  END,
  "sourceRefreshNote" = CASE
    WHEN "reviewStatus" = 'reviewed' AND "sourceType" <> 'not_reviewed' THEN 'No persisted source refresh date is available.'
    ELSE 'Review required before clinical reliance.'
  END
WHERE "sourceRefreshStatus" IS NULL OR "sourceRefreshStatus" = 'UNKNOWN';

CREATE INDEX "MedicationSafetyProfile_sourceRefreshStatus_idx" ON "MedicationSafetyProfile"("sourceRefreshStatus");
CREATE INDEX "MedicationSafetyProfile_lastCheckedAt_idx" ON "MedicationSafetyProfile"("lastCheckedAt");
