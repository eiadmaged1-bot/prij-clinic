-- v1.3.8 additive workflow migration.
-- No data reset, destructive drop, or existing migration rewrite.

ALTER TYPE "PatientType" ADD VALUE IF NOT EXISTS 'INFERTILITY';

DO $$ BEGIN
  CREATE TYPE "ClinicalPhaseType" AS ENUM ('infertility', 'pregnancy', 'gynecology', 'postpartum', 'general', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ClinicalPhaseStatus" AS ENUM ('active', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "InfertilityType" AS ENUM ('primary', 'secondary', 'unknown');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "InfertilityKnownFactor" AS ENUM ('ovulatory', 'tubal', 'male_factor', 'unexplained', 'endometriosis', 'pcos', 'mixed', 'unknown');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "InfertilityEpisodeStatus" AS ENUM ('active', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OvulationInductionMethod" AS ENUM ('tablets', 'injections', 'combined', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OvulationInductionOutcome" AS ENUM ('ongoing', 'ovulation_confirmed', 'no_response', 'cancelled', 'pregnancy', 'failed', 'unknown');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "InvestigationRequestedStatus" AS ENUM ('requested', 'not_requested', 'not_yet', 'unknown');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EstradiolRequiredStatus" AS ENUM ('required', 'not_required', 'not_yet', 'unknown');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "InvestigationCatalogItem" ADD COLUMN IF NOT EXISTS "subcategory" TEXT;
ALTER TABLE "InvestigationCatalogItem" ADD COLUMN IF NOT EXISTS "clinicalGroup" TEXT;
ALTER TABLE "InvestigationCatalogItem" ADD COLUMN IF NOT EXISTS "priorityLevel" INTEGER;
ALTER TABLE "InvestigationCatalogItem" ADD COLUMN IF NOT EXISTS "isHighPriority" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InvestigationCatalogItem" ADD COLUMN IF NOT EXISTS "keywordsJson" JSONB;
ALTER TABLE "InvestigationCatalogItem" ADD COLUMN IF NOT EXISTS "specialty" TEXT;

CREATE TABLE IF NOT EXISTS "PatientClinicalPhase" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "phaseType" "ClinicalPhaseType" NOT NULL,
  "title" TEXT NOT NULL,
  "status" "ClinicalPhaseStatus" NOT NULL DEFAULT 'active',
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  "outcome" TEXT,
  "linkedPregnancyId" UUID,
  "linkedInfertilityEpisodeId" UUID,
  "summaryJson" JSONB,
  "notes" TEXT,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientClinicalPhase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InfertilityEpisode" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "phaseId" UUID,
  "infertilityDurationYears" DECIMAL(5,2),
  "infertilityType" "InfertilityType" NOT NULL DEFAULT 'unknown',
  "knownFactor" "InfertilityKnownFactor" NOT NULL DEFAULT 'unknown',
  "previousInvestigationsJson" JSONB,
  "previousTreatmentJson" JSONB,
  "hadIUI" BOOLEAN,
  "hadICSI" BOOLEAN,
  "icsiAttemptsCount" INTEGER,
  "notes" TEXT,
  "status" "InfertilityEpisodeStatus" NOT NULL DEFAULT 'active',
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InfertilityEpisode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OvulationInductionCycle" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "infertilityEpisodeId" UUID NOT NULL,
  "cycleNumber" INTEGER NOT NULL,
  "lmpDate" DATE,
  "cycleDay" INTEGER,
  "inductionStartDate" DATE,
  "inductionMethod" "OvulationInductionMethod" NOT NULL DEFAULT 'other',
  "medicationNotes" TEXT,
  "outcome" "OvulationInductionOutcome" NOT NULL DEFAULT 'ongoing',
  "followUpDate" DATE,
  "notes" TEXT,
  "amhRequestedStatus" "InvestigationRequestedStatus" NOT NULL DEFAULT 'unknown',
  "amhRequestDate" DATE,
  "amhResultValue" DECIMAL(12,4),
  "amhUnit" TEXT,
  "amhResultDate" DATE,
  "amhNotes" TEXT,
  "e2RequiredStatus" "EstradiolRequiredStatus" NOT NULL DEFAULT 'unknown',
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OvulationInductionCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FollicularMonitoringVisit" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "cycleId" UUID NOT NULL,
  "monitoringDate" DATE NOT NULL,
  "cycleDay" INTEGER,
  "endometrialThicknessMm" DECIMAL(6,2),
  "rightOvaryFollicleCount" INTEGER,
  "rightOvaryMeanSizeMm" DECIMAL(6,2),
  "rightOvaryLargestSizeMm" DECIMAL(6,2),
  "rightOvaryNotes" TEXT,
  "leftOvaryFollicleCount" INTEGER,
  "leftOvaryMeanSizeMm" DECIMAL(6,2),
  "leftOvaryLargestSizeMm" DECIMAL(6,2),
  "leftOvaryNotes" TEXT,
  "plan" TEXT,
  "nextVisitDate" DATE,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FollicularMonitoringVisit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EstradiolResult" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "cycleId" UUID NOT NULL,
  "value" DECIMAL(12,4) NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'pg/mL',
  "resultDate" DATE NOT NULL,
  "cycleDay" INTEGER,
  "notes" TEXT,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EstradiolResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InvestigationFavorite" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "investigationCatalogItemId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestigationFavorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VisitPriceAuditSetting" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "baseVisitPriceX" DECIMAL(12,2) NOT NULL,
  "kashfMultiplier" DECIMAL(6,2) NOT NULL DEFAULT 1,
  "recheckMultiplier" DECIMAL(6,2) NOT NULL DEFAULT 0.5,
  "consultationMultiplier" DECIMAL(6,2) NOT NULL DEFAULT 0.75,
  "urgentMultiplier" DECIMAL(6,2) NOT NULL DEFAULT 2,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisitPriceAuditSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OvulationInductionCycle_infertilityEpisodeId_cycleNumber_key" ON "OvulationInductionCycle"("infertilityEpisodeId", "cycleNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "InvestigationFavorite_userId_investigationCatalogItemId_key" ON "InvestigationFavorite"("userId", "investigationCatalogItemId");

CREATE INDEX IF NOT EXISTS "PatientClinicalPhase_patientId_status_startDate_idx" ON "PatientClinicalPhase"("patientId", "status", "startDate");
CREATE INDEX IF NOT EXISTS "PatientClinicalPhase_phaseType_idx" ON "PatientClinicalPhase"("phaseType");
CREATE INDEX IF NOT EXISTS "PatientClinicalPhase_createdByUserId_idx" ON "PatientClinicalPhase"("createdByUserId");
CREATE INDEX IF NOT EXISTS "PatientClinicalPhase_linkedPregnancyId_idx" ON "PatientClinicalPhase"("linkedPregnancyId");
CREATE INDEX IF NOT EXISTS "PatientClinicalPhase_linkedInfertilityEpisodeId_idx" ON "PatientClinicalPhase"("linkedInfertilityEpisodeId");
CREATE INDEX IF NOT EXISTS "InfertilityEpisode_patientId_status_idx" ON "InfertilityEpisode"("patientId", "status");
CREATE INDEX IF NOT EXISTS "InfertilityEpisode_phaseId_idx" ON "InfertilityEpisode"("phaseId");
CREATE INDEX IF NOT EXISTS "InfertilityEpisode_createdByUserId_idx" ON "InfertilityEpisode"("createdByUserId");
CREATE INDEX IF NOT EXISTS "OvulationInductionCycle_patientId_createdAt_idx" ON "OvulationInductionCycle"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "OvulationInductionCycle_createdByUserId_idx" ON "OvulationInductionCycle"("createdByUserId");
CREATE INDEX IF NOT EXISTS "FollicularMonitoringVisit_patientId_monitoringDate_idx" ON "FollicularMonitoringVisit"("patientId", "monitoringDate");
CREATE INDEX IF NOT EXISTS "FollicularMonitoringVisit_cycleId_monitoringDate_idx" ON "FollicularMonitoringVisit"("cycleId", "monitoringDate");
CREATE INDEX IF NOT EXISTS "FollicularMonitoringVisit_createdByUserId_idx" ON "FollicularMonitoringVisit"("createdByUserId");
CREATE INDEX IF NOT EXISTS "EstradiolResult_patientId_resultDate_idx" ON "EstradiolResult"("patientId", "resultDate");
CREATE INDEX IF NOT EXISTS "EstradiolResult_cycleId_resultDate_idx" ON "EstradiolResult"("cycleId", "resultDate");
CREATE INDEX IF NOT EXISTS "EstradiolResult_createdByUserId_idx" ON "EstradiolResult"("createdByUserId");
CREATE INDEX IF NOT EXISTS "InvestigationCatalogItem_subcategory_idx" ON "InvestigationCatalogItem"("subcategory");
CREATE INDEX IF NOT EXISTS "InvestigationCatalogItem_clinicalGroup_idx" ON "InvestigationCatalogItem"("clinicalGroup");
CREATE INDEX IF NOT EXISTS "InvestigationCatalogItem_isHighPriority_idx" ON "InvestigationCatalogItem"("isHighPriority");
CREATE INDEX IF NOT EXISTS "InvestigationCatalogItem_specialty_idx" ON "InvestigationCatalogItem"("specialty");
CREATE INDEX IF NOT EXISTS "InvestigationFavorite_investigationCatalogItemId_idx" ON "InvestigationFavorite"("investigationCatalogItemId");
CREATE INDEX IF NOT EXISTS "VisitPriceAuditSetting_active_idx" ON "VisitPriceAuditSetting"("active");
CREATE INDEX IF NOT EXISTS "VisitPriceAuditSetting_updatedByUserId_idx" ON "VisitPriceAuditSetting"("updatedByUserId");

ALTER TABLE "PatientClinicalPhase" ADD CONSTRAINT "PatientClinicalPhase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalPhase" ADD CONSTRAINT "PatientClinicalPhase_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalPhase" ADD CONSTRAINT "PatientClinicalPhase_linkedInfertilityEpisodeId_fkey" FOREIGN KEY ("linkedInfertilityEpisodeId") REFERENCES "InfertilityEpisode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InfertilityEpisode" ADD CONSTRAINT "InfertilityEpisode_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InfertilityEpisode" ADD CONSTRAINT "InfertilityEpisode_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "PatientClinicalPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InfertilityEpisode" ADD CONSTRAINT "InfertilityEpisode_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OvulationInductionCycle" ADD CONSTRAINT "OvulationInductionCycle_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OvulationInductionCycle" ADD CONSTRAINT "OvulationInductionCycle_infertilityEpisodeId_fkey" FOREIGN KEY ("infertilityEpisodeId") REFERENCES "InfertilityEpisode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OvulationInductionCycle" ADD CONSTRAINT "OvulationInductionCycle_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FollicularMonitoringVisit" ADD CONSTRAINT "FollicularMonitoringVisit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FollicularMonitoringVisit" ADD CONSTRAINT "FollicularMonitoringVisit_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "OvulationInductionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollicularMonitoringVisit" ADD CONSTRAINT "FollicularMonitoringVisit_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EstradiolResult" ADD CONSTRAINT "EstradiolResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EstradiolResult" ADD CONSTRAINT "EstradiolResult_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "OvulationInductionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EstradiolResult" ADD CONSTRAINT "EstradiolResult_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestigationFavorite" ADD CONSTRAINT "InvestigationFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationFavorite" ADD CONSTRAINT "InvestigationFavorite_investigationCatalogItemId_fkey" FOREIGN KEY ("investigationCatalogItemId") REFERENCES "InvestigationCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisitPriceAuditSetting" ADD CONSTRAINT "VisitPriceAuditSetting_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
