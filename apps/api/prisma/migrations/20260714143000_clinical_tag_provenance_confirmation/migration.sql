ALTER TABLE "ClinicalTagDefinition"
  ADD COLUMN "labelAr" TEXT,
  ADD COLUMN "aliasesArJson" JSONB;

ALTER TABLE "PatientClinicalTag"
  ADD COLUMN "sourceEncounterId" UUID,
  ADD COLUMN "assignmentType" TEXT NOT NULL DEFAULT 'derived',
  ADD COLUMN "doctorConfirmed" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "effectiveDate" DATE,
  ADD COLUMN "resolutionDate" DATE;

UPDATE "PatientClinicalTag"
SET "assignmentType" = 'manual', "doctorConfirmed" = TRUE
WHERE "sourceType" = 'manual';

UPDATE "PatientClinicalTag"
SET "status" = CASE WHEN "historyStatus" = 'historical' THEN 'historical' ELSE 'active' END,
    "effectiveDate" = "tagDate";

CREATE INDEX "PatientClinicalTag_sourceEncounterId_idx" ON "PatientClinicalTag"("sourceEncounterId");
CREATE INDEX "PatientClinicalTag_doctorConfirmed_status_idx" ON "PatientClinicalTag"("doctorConfirmed", "status");
