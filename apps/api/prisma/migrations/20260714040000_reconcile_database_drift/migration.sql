-- Forward-only reconciliation for schema objects that are present in the
-- migration history but were only partially applied to the preserved database.
-- Every statement is safe to replay on a database built from the full chain.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "GuidelineSource"
    GROUP BY "name"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot restore GuidelineSource_name_key: duplicate names exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "GuidelineChunk"
    GROUP BY "sectionId", "chunkIndex"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot restore GuidelineChunk_sectionId_chunkIndex_key: duplicate positions exist';
  END IF;
END $$;

DROP INDEX IF EXISTS "Appointment_status_startAt_idx";

ALTER TABLE "ClinicDepartment" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "ClinicalTagDefinition"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ConsentTemplate" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "EstradiolResult"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ExternalPatientSubmission"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ExternalProvider" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "FollicularMonitoringVisit"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "InfertilityEpisode"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "InvestigationCatalogItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "InvestigationFavorite" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "InvestigationResult" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "OfficialMedicationSourceSnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "OvulationInductionCycle"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PatientClinicalPhase"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PatientClinicalTag"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PatientDocument" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "PatientInternalNote" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "PatientTask" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Referral" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "UserPreference" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "VisitPriceAuditSetting"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "GuidelineChunk"
  ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'pending_governance_review';

ALTER TABLE "GuidelineDocument"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "citationLabel" TEXT NOT NULL DEFAULT 'Local evidence library citation',
  ADD COLUMN IF NOT EXISTS "documentType" TEXT NOT NULL DEFAULT 'demo_text',
  ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'pending_governance_review',
  ADD COLUMN IF NOT EXISTS "storageRef" TEXT;

ALTER TABLE "GuidelineImportJob"
  ADD COLUMN IF NOT EXISTS "createdByUserId" UUID,
  ADD COLUMN IF NOT EXISTS "importType" TEXT NOT NULL DEFAULT 'demo_text',
  ADD COLUMN IF NOT EXISTS "summary" TEXT;

ALTER TABLE "GuidelineReviewDecision"
  ADD COLUMN IF NOT EXISTS "reviewerUserId" UUID;

ALTER TABLE "GuidelineSection"
  ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'pending_governance_review',
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- abbreviation is intentionally nullable and has no uniqueness/default
-- requirement, so existing guideline source content needs no backfill.
ALTER TABLE "GuidelineSource"
  ADD COLUMN IF NOT EXISTS "abbreviation" TEXT;

ALTER TABLE "GuidelineVersion"
  ADD COLUMN IF NOT EXISTS "publishedYear" INTEGER,
  ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;

ALTER TABLE "GuidelineQueryLog"
  ADD COLUMN IF NOT EXISTS "actorUserId" UUID,
  ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'search',
  ADD COLUMN IF NOT EXISTS "queryText" TEXT;

UPDATE "GuidelineQueryLog"
SET "queryText" = COALESCE(NULLIF("query", ''), '(empty)')
WHERE "queryText" IS NULL;

ALTER TABLE "GuidelineQueryLog"
  ALTER COLUMN "queryText" SET DEFAULT '(empty)',
  ALTER COLUMN "queryText" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Appointment_status_idx" ON "Appointment"("status");
CREATE INDEX IF NOT EXISTS "Encounter_voidedByUserId_idx" ON "Encounter"("voidedByUserId");
CREATE INDEX IF NOT EXISTS "GuidelineChunk_citationLabel_idx" ON "GuidelineChunk"("citationLabel");
CREATE INDEX IF NOT EXISTS "GuidelineChunk_reviewStatus_idx" ON "GuidelineChunk"("reviewStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "GuidelineChunk_sectionId_chunkIndex_key"
  ON "GuidelineChunk"("sectionId", "chunkIndex");
CREATE INDEX IF NOT EXISTS "GuidelineDocument_archivedAt_idx" ON "GuidelineDocument"("archivedAt");
CREATE INDEX IF NOT EXISTS "GuidelineDocument_reviewStatus_idx" ON "GuidelineDocument"("reviewStatus");
CREATE INDEX IF NOT EXISTS "GuidelineQueryLog_actorUserId_createdAt_idx"
  ON "GuidelineQueryLog"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "GuidelineQueryLog_mode_idx" ON "GuidelineQueryLog"("mode");
CREATE INDEX IF NOT EXISTS "GuidelineSection_documentId_idx" ON "GuidelineSection"("documentId");
CREATE UNIQUE INDEX IF NOT EXISTS "GuidelineSource_name_key" ON "GuidelineSource"("name");
CREATE INDEX IF NOT EXISTS "GuidelineSource_status_idx" ON "GuidelineSource"("status");
CREATE INDEX IF NOT EXISTS "MedicationSafetyProfile_lastCheckedAt_idx"
  ON "MedicationSafetyProfile"("lastCheckedAt");
CREATE INDEX IF NOT EXISTS "MedicationSafetyProfile_sourceRefreshStatus_idx"
  ON "MedicationSafetyProfile"("sourceRefreshStatus");
CREATE INDEX IF NOT EXISTS "QueueTicket_receptionistUserId_idx" ON "QueueTicket"("receptionistUserId");

COMMIT;
