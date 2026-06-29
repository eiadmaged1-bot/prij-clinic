-- General gynecology starter records. Recording-only; no automatic diagnosis or treatment engine.
CREATE TYPE "GynecologyVisitTemplate" AS ENUM (
  'general',
  'abnormal_uterine_bleeding',
  'pelvic_pain',
  'pcos',
  'fibroid_ovarian_cyst',
  'contraception'
);

CREATE TABLE "GynecologyVisit" (
  "id" UUID NOT NULL,
  "branchId" UUID,
  "patientId" UUID NOT NULL,
  "encounterId" UUID,
  "templateType" "GynecologyVisitTemplate" NOT NULL DEFAULT 'general',
  "visitDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reasonForVisit" TEXT,
  "menstrualHistory" TEXT,
  "bleedingPattern" TEXT,
  "painSymptoms" TEXT,
  "dischargeSymptoms" TEXT,
  "obstetricHistorySummary" TEXT,
  "contraceptionHistory" TEXT,
  "medicalSurgicalHistory" TEXT,
  "examinationNotes" TEXT,
  "doctorImpression" TEXT,
  "doctorPlan" TEXT,
  "followUpDate" DATE,
  "cycleRegularity" TEXT,
  "bleedingDuration" TEXT,
  "bleedingAmount" TEXT,
  "clots" TEXT,
  "intermenstrualBleeding" TEXT,
  "postcoitalBleeding" TEXT,
  "associatedSymptoms" TEXT,
  "pregnancyTestNote" TEXT,
  "painOnset" TEXT,
  "painDuration" TEXT,
  "painSite" TEXT,
  "relationToCycle" TEXT,
  "painSeverity" TEXT,
  "urinaryBowelSymptoms" TEXT,
  "cyclePattern" TEXT,
  "acneHirsutismNote" TEXT,
  "weightMetabolicRiskNote" TEXT,
  "ultrasoundNote" TEXT,
  "labsNote" TEXT,
  "findingSource" TEXT,
  "sizeLocationNote" TEXT,
  "symptoms" TEXT,
  "followUpPlan" TEXT,
  "currentMethod" TEXT,
  "previousMethods" TEXT,
  "contraindicationChecklist" TEXT,
  "counselingNotes" TEXT,
  "chosenMethod" TEXT,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "GynecologyVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GynecologyVisit_branchId_idx" ON "GynecologyVisit"("branchId");
CREATE INDEX "GynecologyVisit_patientId_visitDate_idx" ON "GynecologyVisit"("patientId", "visitDate");
CREATE INDEX "GynecologyVisit_encounterId_idx" ON "GynecologyVisit"("encounterId");
CREATE INDEX "GynecologyVisit_templateType_idx" ON "GynecologyVisit"("templateType");

ALTER TABLE "GynecologyVisit"
  ADD CONSTRAINT "GynecologyVisit_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GynecologyVisit"
  ADD CONSTRAINT "GynecologyVisit_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GynecologyVisit"
  ADD CONSTRAINT "GynecologyVisit_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GynecologyVisit"
  ADD CONSTRAINT "GynecologyVisit_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
