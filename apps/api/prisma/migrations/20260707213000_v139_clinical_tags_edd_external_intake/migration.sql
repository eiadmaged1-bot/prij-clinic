-- v1.3.9 clinical tags, structured previous pregnancy fields, and review-gated external intake.

ALTER TABLE "PreviousPregnancy" ADD COLUMN IF NOT EXISTS "outcomeType" TEXT;
ALTER TABLE "PreviousPregnancy" ADD COLUMN IF NOT EXISTS "babyOutcome" TEXT;
ALTER TABLE "PreviousPregnancy" ADD COLUMN IF NOT EXISTS "livingChild" BOOLEAN;
ALTER TABLE "PreviousPregnancy" ADD COLUMN IF NOT EXISTS "previousCesareanCount" INTEGER;
ALTER TABLE "PreviousPregnancy" ADD COLUMN IF NOT EXISTS "cesareanIndication" TEXT;
ALTER TABLE "PreviousPregnancy" ADD COLUMN IF NOT EXISTS "cesareanComplications" TEXT;

CREATE TABLE IF NOT EXISTS "ClinicalTagDefinition" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "aliasesJson" JSONB,
  "category" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicalTagDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PatientClinicalTag" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "tagDefinitionId" UUID,
  "tagCode" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "tagDate" DATE,
  "notes" TEXT,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientClinicalTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExternalPatientSubmission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source" TEXT NOT NULL DEFAULT 'google_form',
  "language" TEXT NOT NULL DEFAULT 'ar',
  "externalSubmissionId" TEXT,
  "submittedAt" TIMESTAMPTZ(3),
  "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rawAnswersJson" JSONB NOT NULL,
  "mappedPatientJson" JSONB,
  "mappedCaseTypeJson" JSONB,
  "status" TEXT NOT NULL DEFAULT 'pending_review',
  "duplicateCandidatesJson" JSONB,
  "reviewedByUserId" UUID,
  "reviewedAt" TIMESTAMPTZ(3),
  "reviewDecision" TEXT,
  "reviewReason" TEXT,
  "createdPatientId" UUID,
  "attachedPatientId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalPatientSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClinicalTagDefinition_code_key" ON "ClinicalTagDefinition"("code");
CREATE INDEX IF NOT EXISTS "ClinicalTagDefinition_category_idx" ON "ClinicalTagDefinition"("category");
CREATE INDEX IF NOT EXISTS "ClinicalTagDefinition_active_idx" ON "ClinicalTagDefinition"("active");

CREATE UNIQUE INDEX IF NOT EXISTS "PatientClinicalTag_patientId_tagCode_sourceType_sourceId_key" ON "PatientClinicalTag"("patientId", "tagCode", "sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "PatientClinicalTag_patientId_tagCode_idx" ON "PatientClinicalTag"("patientId", "tagCode");
CREATE INDEX IF NOT EXISTS "PatientClinicalTag_tagCode_idx" ON "PatientClinicalTag"("tagCode");
CREATE INDEX IF NOT EXISTS "PatientClinicalTag_category_idx" ON "PatientClinicalTag"("category");
CREATE INDEX IF NOT EXISTS "PatientClinicalTag_sourceType_idx" ON "PatientClinicalTag"("sourceType");
CREATE INDEX IF NOT EXISTS "PatientClinicalTag_tagDate_idx" ON "PatientClinicalTag"("tagDate");
CREATE INDEX IF NOT EXISTS "PatientClinicalTag_createdByUserId_idx" ON "PatientClinicalTag"("createdByUserId");

CREATE INDEX IF NOT EXISTS "ExternalPatientSubmission_status_receivedAt_idx" ON "ExternalPatientSubmission"("status", "receivedAt");
CREATE INDEX IF NOT EXISTS "ExternalPatientSubmission_source_idx" ON "ExternalPatientSubmission"("source");
CREATE INDEX IF NOT EXISTS "ExternalPatientSubmission_externalSubmissionId_idx" ON "ExternalPatientSubmission"("externalSubmissionId");
CREATE INDEX IF NOT EXISTS "ExternalPatientSubmission_createdPatientId_idx" ON "ExternalPatientSubmission"("createdPatientId");
CREATE INDEX IF NOT EXISTS "ExternalPatientSubmission_attachedPatientId_idx" ON "ExternalPatientSubmission"("attachedPatientId");
CREATE INDEX IF NOT EXISTS "ExternalPatientSubmission_reviewedByUserId_idx" ON "ExternalPatientSubmission"("reviewedByUserId");

ALTER TABLE "PatientClinicalTag" ADD CONSTRAINT "PatientClinicalTag_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalTag" ADD CONSTRAINT "PatientClinicalTag_tagDefinitionId_fkey" FOREIGN KEY ("tagDefinitionId") REFERENCES "ClinicalTagDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalTag" ADD CONSTRAINT "PatientClinicalTag_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExternalPatientSubmission" ADD CONSTRAINT "ExternalPatientSubmission_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalPatientSubmission" ADD CONSTRAINT "ExternalPatientSubmission_createdPatientId_fkey" FOREIGN KEY ("createdPatientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalPatientSubmission" ADD CONSTRAINT "ExternalPatientSubmission_attachedPatientId_fkey" FOREIGN KEY ("attachedPatientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
