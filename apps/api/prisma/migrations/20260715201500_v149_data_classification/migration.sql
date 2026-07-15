CREATE TYPE "DataClassification" AS ENUM ('REAL', 'TEST', 'NEEDS_REVIEW', 'QUARANTINED');

ALTER TABLE "Patient" ADD COLUMN "dataClassification" "DataClassification" NOT NULL DEFAULT 'REAL',
ADD COLUMN "classificationReason" TEXT,
ADD COLUMN "classifiedAt" TIMESTAMPTZ(3),
ADD COLUMN "classifiedByUserId" UUID;

ALTER TABLE "ExternalPatientSubmission" ADD COLUMN "dataClassification" "DataClassification" NOT NULL DEFAULT 'REAL',
ADD COLUMN "classificationReason" TEXT,
ADD COLUMN "classifiedAt" TIMESTAMPTZ(3),
ADD COLUMN "classifiedByUserId" UUID;

ALTER TABLE "ObUltrasound" ADD COLUMN "dataClassification" "DataClassification" NOT NULL DEFAULT 'REAL',
ADD COLUMN "classificationReason" TEXT,
ADD COLUMN "classifiedAt" TIMESTAMPTZ(3),
ADD COLUMN "classifiedByUserId" UUID;

ALTER TABLE "Encounter" ADD COLUMN "dataClassification" "DataClassification" NOT NULL DEFAULT 'REAL';
ALTER TABLE "QueueTicket" ADD COLUMN "dataClassification" "DataClassification" NOT NULL DEFAULT 'REAL';

CREATE INDEX "Patient_dataClassification_status_idx" ON "Patient"("dataClassification", "status");
CREATE INDEX "ExternalPatientSubmission_dataClassification_status_idx" ON "ExternalPatientSubmission"("dataClassification", "status");
CREATE INDEX "ObUltrasound_dataClassification_status_idx" ON "ObUltrasound"("dataClassification", "status");
CREATE INDEX "Encounter_dataClassification_status_idx" ON "Encounter"("dataClassification", "status");
CREATE INDEX "QueueTicket_dataClassification_queueDate_idx" ON "QueueTicket"("dataClassification", "queueDate");
