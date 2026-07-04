-- v0.12.5 clinic workflow unification
-- Additive clinical workflow tables and metadata only. No data reset, drops, or billing model changes.

CREATE TYPE "PatientIntakeStatus" AS ENUM ('draft_by_secretary', 'waiting_for_doctor_review', 'reviewed_by_doctor', 'signed_locked');

CREATE TYPE "PatientIntakeType" AS ENUM ('new_patient', 'follow_up', 'emergency', 'pregnancy', 'gynecology', 'ultrasound', 'fertility');

CREATE TYPE "PrescriptionSourceType" AS ENUM ('manual', 'template', 'doctor_shortcut');

ALTER TABLE "Encounter"
  ADD COLUMN "doctorReviewedIntake" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "doctorReviewStatus" TEXT,
  ADD COLUMN "historyClarification" TEXT,
  ADD COLUMN "examinationJson" JSONB,
  ADD COLUMN "ultrasoundFindingsJson" JSONB,
  ADD COLUMN "clinicalImpression" TEXT,
  ADD COLUMN "riskClassification" TEXT,
  ADD COLUMN "followUpJson" JSONB;

ALTER TABLE "Prescription"
  ADD COLUMN "sourceType" "PrescriptionSourceType" NOT NULL DEFAULT 'manual',
  ADD COLUMN "printSnapshotJson" JSONB,
  ADD COLUMN "linkedFollowUpHintsJson" JSONB,
  ALTER COLUMN "patientId" DROP NOT NULL;

ALTER TABLE "InvestigationCatalogItem"
  ADD COLUMN "normalizedName" TEXT,
  ADD COLUMN "aliasesJson" JSONB,
  ADD COLUMN "tagsJson" JSONB;

ALTER TABLE "InvestigationOrder"
  ADD COLUMN "resultDocumentId" UUID,
  ADD COLUMN "reviewedByUserId" UUID,
  ADD COLUMN "reviewedAt" TIMESTAMPTZ(3),
  ADD COLUMN "followUpHintActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "PatientIntake" (
  "id" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "encounterId" UUID,
  "status" "PatientIntakeStatus" NOT NULL DEFAULT 'draft_by_secretary',
  "intakeType" "PatientIntakeType" NOT NULL DEFAULT 'new_patient',
  "patientReportedJson" JSONB,
  "administrativeJson" JSONB,
  "vitalsJson" JSONB,
  "obsIntakeJson" JSONB,
  "gynIntakeJson" JSONB,
  "redFlagsJson" JSONB,
  "attributionJson" JSONB,
  "enteredByUserId" UUID,
  "reviewedByDoctorId" UUID,
  "reviewedAt" TIMESTAMPTZ(3),
  "signedByDoctorId" UUID,
  "signedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PatientIntake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrescriptionTemplate" (
  "id" UUID NOT NULL,
  "ownerUserId" UUID,
  "clinicScope" TEXT,
  "title" TEXT NOT NULL,
  "category" TEXT,
  "diagnosisOrUseCase" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "itemsJson" JSONB NOT NULL,
  "notes" TEXT,
  "createdByUserId" UUID,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PrescriptionTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DoctorMedicationShortcut" (
  "id" UUID NOT NULL,
  "doctorUserId" UUID NOT NULL,
  "displayName" TEXT NOT NULL,
  "genericName" TEXT NOT NULL,
  "optionalBrandOrTradeName" TEXT,
  "medicationCatalogId" UUID,
  "defaultInstructions" TEXT,
  "defaultDoseText" TEXT,
  "defaultTimingText" TEXT,
  "defaultDurationText" TEXT,
  "defaultNotes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "DoctorMedicationShortcut_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PatientIntake_patientId_createdAt_idx" ON "PatientIntake"("patientId", "createdAt");
CREATE INDEX "PatientIntake_encounterId_idx" ON "PatientIntake"("encounterId");
CREATE INDEX "PatientIntake_status_idx" ON "PatientIntake"("status");
CREATE INDEX "PatientIntake_intakeType_idx" ON "PatientIntake"("intakeType");
CREATE INDEX "PatientIntake_enteredByUserId_idx" ON "PatientIntake"("enteredByUserId");
CREATE INDEX "PatientIntake_reviewedByDoctorId_idx" ON "PatientIntake"("reviewedByDoctorId");

CREATE INDEX "PrescriptionTemplate_ownerUserId_idx" ON "PrescriptionTemplate"("ownerUserId");
CREATE INDEX "PrescriptionTemplate_active_idx" ON "PrescriptionTemplate"("active");
CREATE INDEX "PrescriptionTemplate_category_idx" ON "PrescriptionTemplate"("category");

CREATE INDEX "DoctorMedicationShortcut_doctorUserId_active_idx" ON "DoctorMedicationShortcut"("doctorUserId", "active");
CREATE INDEX "DoctorMedicationShortcut_genericName_idx" ON "DoctorMedicationShortcut"("genericName");

ALTER TABLE "PatientIntake" ADD CONSTRAINT "PatientIntake_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PatientIntake" ADD CONSTRAINT "PatientIntake_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
