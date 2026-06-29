-- OB/GYN core depth backend.
-- Recording-only fields. No automatic diagnosis, FGR detection, percentile engine, or fetal-image AI.

ALTER TYPE "PregnancyStatus" ADD VALUE IF NOT EXISTS 'inactive';
ALTER TYPE "PregnancyStatus" ADD VALUE IF NOT EXISTS 'ended';
ALTER TYPE "ObUltrasoundStatus" ADD VALUE IF NOT EXISTS 'final';

ALTER TABLE "Pregnancy"
  ADD COLUMN "riskFlags" TEXT;

CREATE TABLE "PreviousPregnancy" (
  "id" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "pregnancyId" UUID,
  "year" INTEGER,
  "outcomeDate" DATE,
  "outcome" TEXT NOT NULL,
  "gestationalAgeAtOutcome" TEXT,
  "modeOfDelivery" TEXT,
  "birthWeightGrams" INTEGER,
  "sex" TEXT,
  "complications" TEXT,
  "notes" TEXT,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PreviousPregnancy_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PreviousPregnancy"
  ADD CONSTRAINT "PreviousPregnancy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PreviousPregnancy"
  ADD CONSTRAINT "PreviousPregnancy_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "Pregnancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PreviousPregnancy"
  ADD CONSTRAINT "PreviousPregnancy_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PreviousPregnancy_patientId_createdAt_idx" ON "PreviousPregnancy"("patientId", "createdAt");
CREATE INDEX "PreviousPregnancy_pregnancyId_idx" ON "PreviousPregnancy"("pregnancyId");
CREATE INDEX "PreviousPregnancy_outcome_idx" ON "PreviousPregnancy"("outcome");

ALTER TABLE "PregnancyFetus"
  ADD COLUMN "createdByUserId" UUID;

ALTER TABLE "PregnancyFetus"
  ADD CONSTRAINT "PregnancyFetus_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AntenatalVisit"
  ADD COLUMN "pulseBpm" INTEGER,
  ADD COLUMN "edema" TEXT,
  ADD COLUMN "urineProtein" TEXT,
  ADD COLUMN "examinationText" TEXT,
  ADD COLUMN "fundalHeightText" TEXT,
  ADD COLUMN "medicationsNote" TEXT,
  ADD COLUMN "investigationsNote" TEXT;

ALTER TABLE "ObUltrasound"
  ADD COLUMN "fetusId" UUID,
  ADD COLUMN "scanType" TEXT,
  ADD COLUMN "indication" TEXT,
  ADD COLUMN "gestationalAgeDisplay" TEXT,
  ADD COLUMN "fetalHeartText" TEXT,
  ADD COLUMN "bpdMm" DECIMAL(8,2),
  ADD COLUMN "hcMm" DECIMAL(8,2),
  ADD COLUMN "acMm" DECIMAL(8,2),
  ADD COLUMN "flMm" DECIMAL(8,2),
  ADD COLUMN "efwGrams" INTEGER,
  ADD COLUMN "dopplerNote" TEXT;

ALTER TABLE "ObUltrasound"
  ADD CONSTRAINT "ObUltrasound_fetusId_fkey" FOREIGN KEY ("fetusId") REFERENCES "PregnancyFetus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ObUltrasound_fetusId_idx" ON "ObUltrasound"("fetusId");
