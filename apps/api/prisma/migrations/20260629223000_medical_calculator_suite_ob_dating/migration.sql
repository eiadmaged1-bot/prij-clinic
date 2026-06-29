-- Medical calculator suite and OB dating foundation.

CREATE TYPE "PatientType" AS ENUM ('OB', 'GYN', 'WOMEN_HEALTH', 'GENERAL');

ALTER TABLE "Patient" ADD COLUMN "patientType" "PatientType" NOT NULL DEFAULT 'GENERAL';

CREATE TABLE "CalculatorFormula" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "specialty" TEXT,
    "formulaType" TEXT NOT NULL,
    "calculationEngineType" TEXT NOT NULL,
    "implementationStatus" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceYear" INTEGER,
    "sourceVersion" TEXT,
    "sourceUrl" TEXT,
    "inputSchemaJson" JSONB NOT NULL,
    "outputSchemaJson" JSONB NOT NULL,
    "formulaJson" JSONB NOT NULL,
    "unitRulesJson" JSONB,
    "limitationsJson" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CalculatorFormula_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientCalculation" (
    "id" TEXT NOT NULL,
    "patientId" UUID,
    "pregnancyEpisodeId" UUID,
    "fetusId" UUID,
    "formulaId" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL,
    "inputJson" JSONB NOT NULL,
    "outputJson" JSONB NOT NULL,
    "unitJson" JSONB,
    "calculatedAt" TIMESTAMPTZ(3) NOT NULL,
    "calculatedByUserId" UUID NOT NULL,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "status" TEXT NOT NULL,
    "sourceContext" TEXT NOT NULL,
    "notes" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PatientCalculation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PregnancyDatingAssessment" (
    "id" TEXT NOT NULL,
    "patientId" UUID NOT NULL,
    "pregnancyEpisodeId" UUID NOT NULL,
    "datingSource" TEXT NOT NULL,
    "lmpDate" DATE,
    "cycleLengthDays" INTEGER,
    "conceptionDate" DATE,
    "embryoTransferDate" DATE,
    "embryoAgeDays" INTEGER,
    "scanDate" DATE,
    "gaWeeks" INTEGER,
    "gaDays" INTEGER,
    "knownEdd" DATE,
    "calculatedEdd" DATE NOT NULL,
    "calculatedGaAtAssessmentDays" INTEGER,
    "discrepancyDays" INTEGER,
    "confidenceStatus" TEXT NOT NULL,
    "isBestObstetricEstimate" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedByUserId" UUID,
    "lockedAt" TIMESTAMPTZ(3),
    "changeReason" TEXT,
    "calculationFormulaId" TEXT,
    "inputJson" JSONB NOT NULL,
    "outputJson" JSONB NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "voidedAt" TIMESTAMPTZ(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PregnancyDatingAssessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalculatorFormula_code_key" ON "CalculatorFormula"("code");
CREATE INDEX "CalculatorFormula_category_idx" ON "CalculatorFormula"("category");
CREATE INDEX "CalculatorFormula_specialty_idx" ON "CalculatorFormula"("specialty");
CREATE INDEX "CalculatorFormula_implementationStatus_idx" ON "CalculatorFormula"("implementationStatus");
CREATE INDEX "CalculatorFormula_active_idx" ON "CalculatorFormula"("active");
CREATE INDEX "Patient_patientType_idx" ON "Patient"("patientType");
CREATE INDEX "PatientCalculation_patientId_calculatedAt_idx" ON "PatientCalculation"("patientId", "calculatedAt");
CREATE INDEX "PatientCalculation_pregnancyEpisodeId_idx" ON "PatientCalculation"("pregnancyEpisodeId");
CREATE INDEX "PatientCalculation_fetusId_idx" ON "PatientCalculation"("fetusId");
CREATE INDEX "PatientCalculation_formulaId_idx" ON "PatientCalculation"("formulaId");
CREATE INDEX "PatientCalculation_calculatedByUserId_idx" ON "PatientCalculation"("calculatedByUserId");
CREATE INDEX "PatientCalculation_reviewedByUserId_idx" ON "PatientCalculation"("reviewedByUserId");
CREATE INDEX "PatientCalculation_status_idx" ON "PatientCalculation"("status");
CREATE INDEX "PatientCalculation_sourceContext_idx" ON "PatientCalculation"("sourceContext");
CREATE INDEX "PregnancyDatingAssessment_patientId_createdAt_idx" ON "PregnancyDatingAssessment"("patientId", "createdAt");
CREATE INDEX "PregnancyDatingAssessment_pregnancyEpisodeId_createdAt_idx" ON "PregnancyDatingAssessment"("pregnancyEpisodeId", "createdAt");
CREATE INDEX "PregnancyDatingAssessment_datingSource_idx" ON "PregnancyDatingAssessment"("datingSource");
CREATE INDEX "PregnancyDatingAssessment_confidenceStatus_idx" ON "PregnancyDatingAssessment"("confidenceStatus");
CREATE INDEX "PregnancyDatingAssessment_isBestObstetricEstimate_idx" ON "PregnancyDatingAssessment"("isBestObstetricEstimate");
CREATE INDEX "PregnancyDatingAssessment_isLocked_idx" ON "PregnancyDatingAssessment"("isLocked");
CREATE INDEX "PregnancyDatingAssessment_calculationFormulaId_idx" ON "PregnancyDatingAssessment"("calculationFormulaId");
CREATE INDEX "PregnancyDatingAssessment_createdByUserId_idx" ON "PregnancyDatingAssessment"("createdByUserId");
CREATE INDEX "PregnancyDatingAssessment_reviewedByUserId_idx" ON "PregnancyDatingAssessment"("reviewedByUserId");
CREATE INDEX "PregnancyDatingAssessment_lockedByUserId_idx" ON "PregnancyDatingAssessment"("lockedByUserId");

ALTER TABLE "PatientCalculation" ADD CONSTRAINT "PatientCalculation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientCalculation" ADD CONSTRAINT "PatientCalculation_pregnancyEpisodeId_fkey" FOREIGN KEY ("pregnancyEpisodeId") REFERENCES "Pregnancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientCalculation" ADD CONSTRAINT "PatientCalculation_fetusId_fkey" FOREIGN KEY ("fetusId") REFERENCES "PregnancyFetus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientCalculation" ADD CONSTRAINT "PatientCalculation_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "CalculatorFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientCalculation" ADD CONSTRAINT "PatientCalculation_calculatedByUserId_fkey" FOREIGN KEY ("calculatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientCalculation" ADD CONSTRAINT "PatientCalculation_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PregnancyDatingAssessment" ADD CONSTRAINT "PregnancyDatingAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PregnancyDatingAssessment" ADD CONSTRAINT "PregnancyDatingAssessment_pregnancyEpisodeId_fkey" FOREIGN KEY ("pregnancyEpisodeId") REFERENCES "Pregnancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PregnancyDatingAssessment" ADD CONSTRAINT "PregnancyDatingAssessment_calculationFormulaId_fkey" FOREIGN KEY ("calculationFormulaId") REFERENCES "CalculatorFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PregnancyDatingAssessment" ADD CONSTRAINT "PregnancyDatingAssessment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PregnancyDatingAssessment" ADD CONSTRAINT "PregnancyDatingAssessment_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PregnancyDatingAssessment" ADD CONSTRAINT "PregnancyDatingAssessment_lockedByUserId_fkey" FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
