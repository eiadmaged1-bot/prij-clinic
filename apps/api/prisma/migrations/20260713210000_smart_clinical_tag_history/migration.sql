-- Forward-only structured clinical tag and medication history fields.
-- Existing rows remain current unless a clinician explicitly marks them historical.

ALTER TABLE "PatientClinicalTag" ADD COLUMN IF NOT EXISTS "historyStatus" TEXT NOT NULL DEFAULT 'current';
ALTER TABLE "PatientClinicalTag" ADD COLUMN IF NOT EXISTS "tagYear" INTEGER;
ALTER TABLE "PatientClinicalTag" ADD COLUMN IF NOT EXISTS "detailJson" JSONB;
ALTER TABLE "PatientClinicalTag" ADD COLUMN IF NOT EXISTS "manualNote" TEXT;

ALTER TABLE "PatientMedicationHistoryItem" ADD COLUMN IF NOT EXISTS "clinicalGroupSnapshot" TEXT;
ALTER TABLE "PatientMedicationHistoryItem" ADD COLUMN IF NOT EXISTS "indication" TEXT;
ALTER TABLE "PatientMedicationHistoryItem" ADD COLUMN IF NOT EXISTS "startDate" DATE;
ALTER TABLE "PatientMedicationHistoryItem" ADD COLUMN IF NOT EXISTS "stopDate" DATE;

CREATE INDEX IF NOT EXISTS "PatientClinicalTag_historyStatus_idx" ON "PatientClinicalTag"("historyStatus");
CREATE INDEX IF NOT EXISTS "PatientClinicalTag_tagYear_idx" ON "PatientClinicalTag"("tagYear");
CREATE INDEX IF NOT EXISTS "PatientMedicationHistoryItem_familyNameSnapshot_idx" ON "PatientMedicationHistoryItem"("familyNameSnapshot");
CREATE INDEX IF NOT EXISTS "PatientMedicationHistoryItem_clinicalGroupSnapshot_idx" ON "PatientMedicationHistoryItem"("clinicalGroupSnapshot");
