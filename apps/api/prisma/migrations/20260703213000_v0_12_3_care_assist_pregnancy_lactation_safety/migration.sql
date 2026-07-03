-- v0.12.3 Care Assist + pregnancy/lactation medication safety profiles.
-- Additive safety and documentation-support schema only.
-- No dosing, price, stock, brand/trade, pharmacy, or inventory fields are added.

CREATE TYPE "CareAssistRuleCategory" AS ENUM (
  'DOCUMENTATION_COMPLETENESS',
  'CLINICAL_SAFETY_REVIEW',
  'FOLLOW_UP',
  'MEDICATION_SAFETY',
  'PREGNANCY_SAFETY',
  'LACTATION_SAFETY',
  'INVESTIGATION_FOLLOW_UP',
  'HISTORY_COMPLETENESS'
);

CREATE TYPE "CareAssistAppliesTo" AS ENUM (
  'PATIENT',
  'HISTORY_SHEET',
  'PRESCRIPTION',
  'INVESTIGATION_ORDER',
  'ENCOUNTER',
  'PREGNANCY'
);

CREATE TYPE "CareAssistSeverity" AS ENUM (
  'INFO',
  'LOW',
  'MODERATE',
  'HIGH',
  'CRITICAL_REVIEW'
);

CREATE TYPE "CareAssistFindingStatus" AS ENUM (
  'ACTIVE',
  'ACCEPTED',
  'DISMISSED',
  'SNOOZED',
  'RESOLVED'
);

CREATE TYPE "CareAssistDecisionValue" AS ENUM (
  'ACCEPT',
  'DISMISS',
  'SNOOZE',
  'RESOLVE'
);

CREATE TYPE "LegacyPregnancyCategory" AS ENUM (
  'A',
  'B',
  'C',
  'D',
  'X',
  'N',
  'UNKNOWN',
  'REVIEW_REQUIRED'
);

CREATE TYPE "LactationRiskLevel" AS ENUM (
  'COMPATIBLE',
  'CAUTION',
  'AVOID',
  'INSUFFICIENT_DATA',
  'UNKNOWN',
  'REVIEW_REQUIRED'
);

CREATE TYPE "MedicationSafetyProfileSourceType" AS ENUM (
  'official_label',
  'curated_reference',
  'guideline',
  'licensed_database',
  'manual_review',
  'not_reviewed'
);

CREATE TYPE "MedicationSafetyProfileReviewStatus" AS ENUM (
  'reviewed',
  'needs_review',
  'imported',
  'retired'
);

CREATE TYPE "MedicationSafetyProfileConfidenceLevel" AS ENUM (
  'high',
  'moderate',
  'low',
  'unknown'
);

CREATE TABLE "CareAssistRule" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" "CareAssistRuleCategory" NOT NULL,
  "appliesTo" "CareAssistAppliesTo" NOT NULL,
  "severity" "CareAssistSeverity" NOT NULL,
  "triggerJson" JSONB NOT NULL,
  "messageTemplate" TEXT NOT NULL,
  "actionLabel" TEXT,
  "evidenceRequired" BOOLEAN NOT NULL DEFAULT false,
  "sourceType" TEXT NOT NULL DEFAULT 'local_rule',
  "sourceName" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "CareAssistRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareAssistFinding" (
  "id" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "encounterId" UUID,
  "historySheetId" UUID,
  "prescriptionId" UUID,
  "investigationOrderId" UUID,
  "ruleId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "category" "CareAssistRuleCategory" NOT NULL,
  "severity" "CareAssistSeverity" NOT NULL,
  "status" "CareAssistFindingStatus" NOT NULL DEFAULT 'ACTIVE',
  "dataUsedJson" JSONB NOT NULL,
  "missingFieldsJson" JSONB NOT NULL,
  "suggestedActionJson" JSONB NOT NULL,
  "sourceJson" JSONB,
  "dueAt" TIMESTAMPTZ(3),
  "snoozedUntil" TIMESTAMPTZ(3),
  "decisionReason" TEXT,
  "decidedByUserId" UUID,
  "decidedAt" TIMESTAMPTZ(3),
  "contextHash" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "CareAssistFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareAssistDecision" (
  "id" UUID NOT NULL,
  "findingId" UUID NOT NULL,
  "decision" "CareAssistDecisionValue" NOT NULL,
  "reason" TEXT,
  "decidedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CareAssistDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MedicationSafetyProfile" (
  "id" UUID NOT NULL,
  "medicationGenericId" UUID NOT NULL,
  "legacyPregnancyCategory" "LegacyPregnancyCategory" NOT NULL,
  "pregnancyRiskSummary" TEXT,
  "pregnancyClinicalConsiderations" TEXT,
  "pregnancyDataSummary" TEXT,
  "trimesterNotesJson" JSONB,
  "lactationRiskLevel" "LactationRiskLevel" NOT NULL,
  "lactationRiskSummary" TEXT,
  "lactationMilkTransferSummary" TEXT,
  "lactationInfantEffectsSummary" TEXT,
  "lactationClinicalConsiderations" TEXT,
  "reproductivePotentialNotes" TEXT,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceYear" INTEGER,
  "sourceType" "MedicationSafetyProfileSourceType" NOT NULL,
  "reviewStatus" "MedicationSafetyProfileReviewStatus" NOT NULL,
  "confidenceLevel" "MedicationSafetyProfileConfidenceLevel" NOT NULL,
  "reviewedByUserId" UUID,
  "reviewedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "MedicationSafetyProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareAssistRule_code_key" ON "CareAssistRule"("code");
CREATE INDEX "CareAssistRule_category_idx" ON "CareAssistRule"("category");
CREATE INDEX "CareAssistRule_appliesTo_idx" ON "CareAssistRule"("appliesTo");
CREATE INDEX "CareAssistRule_severity_idx" ON "CareAssistRule"("severity");
CREATE INDEX "CareAssistRule_isActive_idx" ON "CareAssistRule"("isActive");

CREATE INDEX "CareAssistFinding_patientId_status_idx" ON "CareAssistFinding"("patientId", "status");
CREATE INDEX "CareAssistFinding_encounterId_idx" ON "CareAssistFinding"("encounterId");
CREATE INDEX "CareAssistFinding_historySheetId_idx" ON "CareAssistFinding"("historySheetId");
CREATE INDEX "CareAssistFinding_prescriptionId_idx" ON "CareAssistFinding"("prescriptionId");
CREATE INDEX "CareAssistFinding_investigationOrderId_idx" ON "CareAssistFinding"("investigationOrderId");
CREATE INDEX "CareAssistFinding_category_idx" ON "CareAssistFinding"("category");
CREATE INDEX "CareAssistFinding_severity_idx" ON "CareAssistFinding"("severity");
CREATE INDEX "CareAssistFinding_dueAt_idx" ON "CareAssistFinding"("dueAt");
CREATE INDEX "CareAssistFinding_snoozedUntil_idx" ON "CareAssistFinding"("snoozedUntil");
CREATE UNIQUE INDEX "CareAssistFinding_ruleId_patientId_contextHash_key" ON "CareAssistFinding"("ruleId", "patientId", "contextHash");

CREATE INDEX "CareAssistDecision_findingId_createdAt_idx" ON "CareAssistDecision"("findingId", "createdAt");
CREATE INDEX "CareAssistDecision_decision_idx" ON "CareAssistDecision"("decision");
CREATE INDEX "CareAssistDecision_decidedByUserId_idx" ON "CareAssistDecision"("decidedByUserId");

CREATE UNIQUE INDEX "MedicationSafetyProfile_medicationGenericId_key" ON "MedicationSafetyProfile"("medicationGenericId");
CREATE INDEX "MedicationSafetyProfile_legacyPregnancyCategory_idx" ON "MedicationSafetyProfile"("legacyPregnancyCategory");
CREATE INDEX "MedicationSafetyProfile_lactationRiskLevel_idx" ON "MedicationSafetyProfile"("lactationRiskLevel");
CREATE INDEX "MedicationSafetyProfile_sourceType_idx" ON "MedicationSafetyProfile"("sourceType");
CREATE INDEX "MedicationSafetyProfile_reviewStatus_idx" ON "MedicationSafetyProfile"("reviewStatus");
CREATE INDEX "MedicationSafetyProfile_confidenceLevel_idx" ON "MedicationSafetyProfile"("confidenceLevel");
CREATE INDEX "MedicationSafetyProfile_reviewedByUserId_idx" ON "MedicationSafetyProfile"("reviewedByUserId");

ALTER TABLE "CareAssistFinding" ADD CONSTRAINT "CareAssistFinding_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareAssistFinding" ADD CONSTRAINT "CareAssistFinding_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareAssistFinding" ADD CONSTRAINT "CareAssistFinding_historySheetId_fkey" FOREIGN KEY ("historySheetId") REFERENCES "PatientHistorySheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareAssistFinding" ADD CONSTRAINT "CareAssistFinding_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareAssistFinding" ADD CONSTRAINT "CareAssistFinding_investigationOrderId_fkey" FOREIGN KEY ("investigationOrderId") REFERENCES "InvestigationOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareAssistFinding" ADD CONSTRAINT "CareAssistFinding_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CareAssistRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareAssistFinding" ADD CONSTRAINT "CareAssistFinding_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CareAssistDecision" ADD CONSTRAINT "CareAssistDecision_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "CareAssistFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareAssistDecision" ADD CONSTRAINT "CareAssistDecision_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicationSafetyProfile" ADD CONSTRAINT "MedicationSafetyProfile_medicationGenericId_fkey" FOREIGN KEY ("medicationGenericId") REFERENCES "MedicationGeneric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicationSafetyProfile" ADD CONSTRAINT "MedicationSafetyProfile_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
