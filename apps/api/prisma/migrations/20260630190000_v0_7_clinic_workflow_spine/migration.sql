ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS 'result_ready';
ALTER TYPE "InvestigationPriority" ADD VALUE IF NOT EXISTS 'stat';

DO $$ BEGIN
  CREATE TYPE "ConsentSignatureStatus" AS ENUM ('not_required', 'pending', 'captured_demo', 'declined', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvestigationOrderSource" AS ENUM ('doctor', 'reception', 'patient_file', 'external_referral');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvestigationBillingStatus" AS ENUM ('not_billable', 'pending_invoice', 'invoiced', 'paid', 'waived_demo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvestigationResultReviewStatus" AS ENUM ('pending_review', 'reviewed', 'needs_follow_up', 'amended', 'voided');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExternalProviderType" AS ENUM ('laboratory', 'radiology_center', 'hospital', 'referral_doctor', 'pharmacy', 'insurance_company_placeholder', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ClinicDepartmentType" AS ENUM ('reception', 'doctor_room', 'laboratory', 'radiology', 'ultrasound', 'nursing', 'finance', 'admin', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientDocumentType" AS ENUM ('lab_result', 'radiology_result', 'ultrasound_report', 'consent_form', 'referral_letter', 'external_report', 'clinical_photo_demo_only', 'insurance_document_placeholder', 'identity_document_demo_only', 'procedure_document', 'discharge_summary_placeholder', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientDocumentStatus" AS ENUM ('draft_metadata', 'active', 'reviewed', 'archived', 'voided');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientDocumentStorageMode" AS ENUM ('metadata_only', 'local_demo_file', 'external_reference_placeholder');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientDocumentConfidentialityLevel" AS ENUM ('normal', 'sensitive', 'restricted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ConsentTemplateCategory" AS ENUM ('general_treatment', 'procedure', 'ultrasound', 'report_storage', 'ai_processing', 'communication', 'privacy', 'referral', 'photography_demo_only', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ConsentTemplateLanguage" AS ENUM ('en', 'ar', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReferralDirection" AS ENUM ('outbound', 'inbound', 'internal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReferralType" AS ENUM ('lab', 'radiology', 'fetal_medicine', 'hospital', 'specialist', 'emergency', 'insurance_placeholder', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReferralUrgency" AS ENUM ('routine', 'urgent', 'emergency');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReferralStatus" AS ENUM ('draft', 'sent', 'accepted', 'completed', 'cancelled', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientTaskType" AS ENUM ('call_patient', 'collect_sample', 'review_result', 'prepare_document', 'collect_payment', 'schedule_follow_up', 'referral_follow_up', 'admin_task', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientTaskPriority" AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientTaskStatus" AS ENUM ('open', 'in_progress', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientInternalNoteType" AS ENUM ('reception_note', 'clinical_note', 'billing_note', 'document_note', 'safety_note', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientInternalNoteVisibility" AS ENUM ('internal_all', 'clinical_only', 'admin_only', 'finance_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "templateId" UUID;
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "signedByName" TEXT;
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "relationshipToPatient" TEXT;
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "guardianName" TEXT;
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "witnessName" TEXT;
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "signatureStatus" "ConsentSignatureStatus" NOT NULL DEFAULT 'not_required';
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMPTZ(3);
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "legalNotes" TEXT;
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "documentId" UUID;
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "reviewedByUserId" UUID;
ALTER TABLE "ConsentRecord" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMPTZ(3);

ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "orderNumber" TEXT;
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "orderSource" "InvestigationOrderSource" NOT NULL DEFAULT 'doctor';
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "orderType" "InvestigationCategory" NOT NULL DEFAULT 'laboratory';
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "clinicalQuestion" TEXT;
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "diagnosisText" TEXT;
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "targetDepartment" TEXT;
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "externalProviderId" UUID;
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "billingStatus" "InvestigationBillingStatus" NOT NULL DEFAULT 'not_billable';
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;
ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "voidReason" TEXT;

ALTER TABLE "InvestigationOrderItem" ADD COLUMN IF NOT EXISTS "itemCode" TEXT;
ALTER TABLE "InvestigationOrderItem" ADD COLUMN IF NOT EXISTS "itemName" TEXT;
ALTER TABLE "InvestigationOrderItem" ADD COLUMN IF NOT EXISTS "specimenType" TEXT;
ALTER TABLE "InvestigationOrderItem" ADD COLUMN IF NOT EXISTS "bodySite" TEXT;
ALTER TABLE "InvestigationOrderItem" ADD COLUMN IF NOT EXISTS "laterality" TEXT;
ALTER TABLE "InvestigationOrderItem" ADD COLUMN IF NOT EXISTS "resultId" UUID;

CREATE TABLE IF NOT EXISTS "ExternalProvider" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "providerType" "ExternalProviderType" NOT NULL,
  "contactName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ExternalProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ClinicDepartment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "branchId" UUID,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "departmentType" "ClinicDepartmentType" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ClinicDepartment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InvestigationResult" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "branchId" UUID,
  "orderId" UUID,
  "orderItemId" UUID,
  "reportId" UUID,
  "resultNumber" TEXT,
  "category" "InvestigationCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "resultDate" TIMESTAMPTZ(3),
  "sampleDate" TIMESTAMPTZ(3),
  "performedByText" TEXT,
  "externalProviderId" UUID,
  "summaryText" TEXT,
  "structuredValuesJson" JSONB,
  "abnormalFlag" BOOLEAN NOT NULL DEFAULT false,
  "criticalFlag" BOOLEAN NOT NULL DEFAULT false,
  "criticalAcknowledgedAt" TIMESTAMPTZ(3),
  "criticalAcknowledgedByUserId" UUID,
  "reviewStatus" "InvestigationResultReviewStatus" NOT NULL DEFAULT 'pending_review',
  "doctorComment" TEXT,
  "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
  "followUpDate" DATE,
  "reviewedByUserId" UUID,
  "reviewedAt" TIMESTAMPTZ(3),
  "createdByUserId" UUID,
  "voidReason" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "InvestigationResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PatientDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "branchId" UUID,
  "linkedReportId" UUID,
  "linkedResultId" UUID,
  "linkedConsentRecordId" UUID,
  "linkedEncounterId" UUID,
  "linkedPrescriptionId" UUID,
  "title" TEXT NOT NULL,
  "documentType" "PatientDocumentType" NOT NULL,
  "category" TEXT NOT NULL,
  "status" "PatientDocumentStatus" NOT NULL DEFAULT 'draft_metadata',
  "storageMode" "PatientDocumentStorageMode" NOT NULL DEFAULT 'metadata_only',
  "fileName" TEXT,
  "fileMimeType" TEXT,
  "fileSizeBytes" INTEGER,
  "fileReference" TEXT,
  "fileSha256" TEXT,
  "sourceText" TEXT,
  "summaryText" TEXT,
  "tagsJson" JSONB,
  "confidentialityLevel" "PatientDocumentConfidentialityLevel" NOT NULL DEFAULT 'normal',
  "uploadedByUserId" UUID,
  "reviewedByUserId" UUID,
  "reviewedAt" TIMESTAMPTZ(3),
  "archivedByUserId" UUID,
  "archivedAt" TIMESTAMPTZ(3),
  "archiveReason" TEXT,
  "voidReason" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PatientDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ConsentTemplate" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" "ConsentTemplateCategory" NOT NULL,
  "language" "ConsentTemplateLanguage" NOT NULL DEFAULT 'en',
  "versionLabel" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL,
  "fieldsJson" JSONB,
  "requiresWitness" BOOLEAN NOT NULL DEFAULT false,
  "requiresGuardian" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ConsentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Referral" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "branchId" UUID,
  "encounterId" UUID,
  "pregnancyId" UUID,
  "referredByUserId" UUID,
  "referralDirection" "ReferralDirection" NOT NULL DEFAULT 'outbound',
  "referralType" "ReferralType" NOT NULL,
  "referredToProviderId" UUID,
  "referredToText" TEXT,
  "reason" TEXT NOT NULL,
  "clinicalSummary" TEXT,
  "urgency" "ReferralUrgency" NOT NULL DEFAULT 'routine',
  "status" "ReferralStatus" NOT NULL DEFAULT 'draft',
  "sentAt" TIMESTAMPTZ(3),
  "completedAt" TIMESTAMPTZ(3),
  "closedAt" TIMESTAMPTZ(3),
  "closureNote" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PatientTask" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID,
  "branchId" UUID,
  "assignedToUserId" UUID,
  "createdByUserId" UUID,
  "relatedOrderId" UUID,
  "relatedResultId" UUID,
  "relatedDocumentId" UUID,
  "relatedConsentId" UUID,
  "taskType" "PatientTaskType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "PatientTaskPriority" NOT NULL DEFAULT 'normal',
  "status" "PatientTaskStatus" NOT NULL DEFAULT 'open',
  "dueAt" TIMESTAMPTZ(3),
  "completedAt" TIMESTAMPTZ(3),
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PatientTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PatientInternalNote" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "branchId" UUID,
  "createdByUserId" UUID,
  "noteType" "PatientInternalNoteType" NOT NULL,
  "visibility" "PatientInternalNoteVisibility" NOT NULL DEFAULT 'internal_all',
  "title" TEXT,
  "bodyText" TEXT NOT NULL,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "archiveReason" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PatientInternalNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InvestigationOrder_orderNumber_key" ON "InvestigationOrder"("orderNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "ClinicDepartment_code_key" ON "ClinicDepartment"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "InvestigationResult_resultNumber_key" ON "InvestigationResult"("resultNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "ConsentTemplate_code_key" ON "ConsentTemplate"("code");

CREATE INDEX IF NOT EXISTS "ConsentRecord_templateId_idx" ON "ConsentRecord"("templateId");
CREATE INDEX IF NOT EXISTS "ConsentRecord_signatureStatus_idx" ON "ConsentRecord"("signatureStatus");
CREATE INDEX IF NOT EXISTS "InvestigationOrder_orderNumber_idx" ON "InvestigationOrder"("orderNumber");
CREATE INDEX IF NOT EXISTS "InvestigationOrder_orderType_idx" ON "InvestigationOrder"("orderType");
CREATE INDEX IF NOT EXISTS "InvestigationOrder_billingStatus_idx" ON "InvestigationOrder"("billingStatus");
CREATE INDEX IF NOT EXISTS "InvestigationOrderItem_resultId_idx" ON "InvestigationOrderItem"("resultId");
CREATE INDEX IF NOT EXISTS "ExternalProvider_providerType_idx" ON "ExternalProvider"("providerType");
CREATE INDEX IF NOT EXISTS "ExternalProvider_active_idx" ON "ExternalProvider"("active");
CREATE INDEX IF NOT EXISTS "ClinicDepartment_branchId_idx" ON "ClinicDepartment"("branchId");
CREATE INDEX IF NOT EXISTS "ClinicDepartment_departmentType_idx" ON "ClinicDepartment"("departmentType");
CREATE INDEX IF NOT EXISTS "ClinicDepartment_active_idx" ON "ClinicDepartment"("active");
CREATE INDEX IF NOT EXISTS "InvestigationResult_patientId_createdAt_idx" ON "InvestigationResult"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "InvestigationResult_branchId_idx" ON "InvestigationResult"("branchId");
CREATE INDEX IF NOT EXISTS "InvestigationResult_orderId_idx" ON "InvestigationResult"("orderId");
CREATE INDEX IF NOT EXISTS "InvestigationResult_orderItemId_idx" ON "InvestigationResult"("orderItemId");
CREATE INDEX IF NOT EXISTS "InvestigationResult_reportId_idx" ON "InvestigationResult"("reportId");
CREATE INDEX IF NOT EXISTS "InvestigationResult_category_idx" ON "InvestigationResult"("category");
CREATE INDEX IF NOT EXISTS "InvestigationResult_reviewStatus_idx" ON "InvestigationResult"("reviewStatus");
CREATE INDEX IF NOT EXISTS "InvestigationResult_criticalFlag_reviewStatus_idx" ON "InvestigationResult"("criticalFlag", "reviewStatus");
CREATE INDEX IF NOT EXISTS "PatientDocument_patientId_createdAt_idx" ON "PatientDocument"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "PatientDocument_branchId_idx" ON "PatientDocument"("branchId");
CREATE INDEX IF NOT EXISTS "PatientDocument_documentType_idx" ON "PatientDocument"("documentType");
CREATE INDEX IF NOT EXISTS "PatientDocument_status_idx" ON "PatientDocument"("status");
CREATE INDEX IF NOT EXISTS "PatientDocument_storageMode_idx" ON "PatientDocument"("storageMode");
CREATE INDEX IF NOT EXISTS "PatientDocument_confidentialityLevel_idx" ON "PatientDocument"("confidentialityLevel");
CREATE INDEX IF NOT EXISTS "ConsentTemplate_category_idx" ON "ConsentTemplate"("category");
CREATE INDEX IF NOT EXISTS "ConsentTemplate_language_idx" ON "ConsentTemplate"("language");
CREATE INDEX IF NOT EXISTS "ConsentTemplate_active_idx" ON "ConsentTemplate"("active");
CREATE INDEX IF NOT EXISTS "Referral_patientId_createdAt_idx" ON "Referral"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "Referral_branchId_idx" ON "Referral"("branchId");
CREATE INDEX IF NOT EXISTS "Referral_status_idx" ON "Referral"("status");
CREATE INDEX IF NOT EXISTS "Referral_urgency_idx" ON "Referral"("urgency");
CREATE INDEX IF NOT EXISTS "PatientTask_patientId_createdAt_idx" ON "PatientTask"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "PatientTask_branchId_idx" ON "PatientTask"("branchId");
CREATE INDEX IF NOT EXISTS "PatientTask_assignedToUserId_idx" ON "PatientTask"("assignedToUserId");
CREATE INDEX IF NOT EXISTS "PatientTask_status_idx" ON "PatientTask"("status");
CREATE INDEX IF NOT EXISTS "PatientTask_dueAt_idx" ON "PatientTask"("dueAt");
CREATE INDEX IF NOT EXISTS "PatientInternalNote_patientId_createdAt_idx" ON "PatientInternalNote"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "PatientInternalNote_branchId_idx" ON "PatientInternalNote"("branchId");
CREATE INDEX IF NOT EXISTS "PatientInternalNote_visibility_idx" ON "PatientInternalNote"("visibility");
CREATE INDEX IF NOT EXISTS "PatientInternalNote_archived_idx" ON "PatientInternalNote"("archived");

ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClinicDepartment" ADD CONSTRAINT "ClinicDepartment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvestigationResult" ADD CONSTRAINT "InvestigationResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestigationResult" ADD CONSTRAINT "InvestigationResult_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvestigationResult" ADD CONSTRAINT "InvestigationResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "InvestigationOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvestigationResult" ADD CONSTRAINT "InvestigationResult_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvestigationOrderItem" ADD CONSTRAINT "InvestigationOrderItem_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "InvestigationResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientDocument" ADD CONSTRAINT "PatientDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientDocument" ADD CONSTRAINT "PatientDocument_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientTask" ADD CONSTRAINT "PatientTask_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientTask" ADD CONSTRAINT "PatientTask_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientInternalNote" ADD CONSTRAINT "PatientInternalNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientInternalNote" ADD CONSTRAINT "PatientInternalNote_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
