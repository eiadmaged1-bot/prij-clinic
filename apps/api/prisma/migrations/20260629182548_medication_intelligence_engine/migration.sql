-- AlterTable
ALTER TABLE "PrescriptionItem" ADD COLUMN     "brandName" TEXT,
ADD COLUMN     "dosageForm" TEXT,
ADD COLUMN     "drugMarketVariantId" UUID,
ADD COLUMN     "genericName" TEXT,
ADD COLUMN     "medicationProductId" UUID,
ADD COLUMN     "strengthText" TEXT,
ADD COLUMN     "tradeName" TEXT;

-- CreateTable
CREATE TABLE "DrugFamily" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "aliases" JSONB,
    "normalizedSearchText" TEXT NOT NULL,
    "therapeuticClass" TEXT,
    "pharmacologicClass" TEXT,
    "restrictedFlag" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'catalog_only',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DrugFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationIngredient" (
    "id" UUID NOT NULL,
    "genericName" TEXT NOT NULL,
    "scientificName" TEXT,
    "normalizedSearchText" TEXT NOT NULL,
    "therapeuticClass" TEXT,
    "pharmacologicClass" TEXT,
    "atcCode" TEXT,
    "rxCui" TEXT,
    "pregnancyReviewFlag" BOOLEAN NOT NULL DEFAULT false,
    "lactationReviewFlag" BOOLEAN NOT NULL DEFAULT false,
    "renalReviewFlag" BOOLEAN NOT NULL DEFAULT false,
    "hepaticReviewFlag" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationFamilyMembership" (
    "id" UUID NOT NULL,
    "ingredientId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "sourceStatus" TEXT NOT NULL DEFAULT 'catalog_only',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationFamilyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationProduct" (
    "id" UUID NOT NULL,
    "ingredientId" UUID,
    "genericName" TEXT NOT NULL,
    "brandName" TEXT,
    "normalizedSearchText" TEXT NOT NULL,
    "route" TEXT,
    "dosageForm" TEXT,
    "strengthText" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "sourceId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationLabelSection" (
    "id" UUID NOT NULL,
    "ingredientId" UUID,
    "productId" UUID,
    "sectionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summaryText" TEXT NOT NULL,
    "sourceId" UUID,
    "verificationStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationLabelSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationInteractionRule" (
    "id" UUID NOT NULL,
    "ruleType" TEXT NOT NULL,
    "primaryIngredientId" UUID,
    "secondaryIngredientId" UUID,
    "primaryFamilyId" UUID,
    "secondaryFamilyId" UUID,
    "herbalProductId" UUID,
    "severity" TEXT NOT NULL DEFAULT 'moderate',
    "alertTitle" TEXT NOT NULL,
    "alertSummary" TEXT NOT NULL,
    "evidenceSource" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationInteractionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HerbalProduct" (
    "id" UUID NOT NULL,
    "commonName" TEXT NOT NULL,
    "botanicalName" TEXT,
    "aliases" JSONB,
    "normalizedSearchText" TEXT NOT NULL,
    "cautionSummary" TEXT,
    "pregnancyReviewFlag" BOOLEAN NOT NULL DEFAULT true,
    "lactationReviewFlag" BOOLEAN NOT NULL DEFAULT true,
    "verificationStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "HerbalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAllergy" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "allergyType" TEXT NOT NULL,
    "medicationProductId" UUID,
    "ingredientId" UUID,
    "familyId" UUID,
    "herbalProductId" UUID,
    "displayName" TEXT NOT NULL,
    "reactionText" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'active',
    "recordedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientMedication" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "medicationType" TEXT NOT NULL DEFAULT 'prescription',
    "medicationProductId" UUID,
    "drugMarketVariantId" UUID,
    "herbalProductId" UUID,
    "displayName" TEXT NOT NULL,
    "genericName" TEXT,
    "tradeName" TEXT,
    "strengthText" TEXT,
    "dosageForm" TEXT,
    "route" TEXT,
    "sourceText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "recordedByUserId" UUID,
    "stoppedByUserId" UUID,
    "stoppedAt" TIMESTAMPTZ(3),
    "stopReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PatientMedication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationSafetyCheck" (
    "id" UUID NOT NULL,
    "patientId" UUID,
    "prescriptionId" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contextSummary" TEXT,
    "checkedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationSafetyCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationSafetyAlert" (
    "id" UUID NOT NULL,
    "safetyCheckId" UUID NOT NULL,
    "severity" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "overrideReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationSafetyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationDataSource" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'catalog_only',
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationDataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationDataImportJob" (
    "id" UUID NOT NULL,
    "sourceId" UUID,
    "status" TEXT NOT NULL DEFAULT 'needs_review',
    "fileName" TEXT,
    "summaryText" TEXT,
    "errorMessage" TEXT,
    "requestedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationDataImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketCountry" (
    "id" UUID NOT NULL,
    "countryCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "compactBadgeLabel" TEXT,
    "showCompactBadgeByDefault" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DrugMarketCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketSource" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT,
    "sourceType" TEXT NOT NULL,
    "priorityRank" INTEGER NOT NULL DEFAULT 100,
    "policyStatus" TEXT NOT NULL DEFAULT 'approved',
    "verificationStatus" TEXT NOT NULL DEFAULT 'catalog_only',
    "websiteUrl" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DrugMarketSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketProduct" (
    "id" UUID NOT NULL,
    "tradeName" TEXT NOT NULL,
    "genericName" TEXT,
    "scientificName" TEXT,
    "normalizedSearchText" TEXT NOT NULL,
    "familyText" TEXT,
    "manufacturer" TEXT,
    "marketingCompany" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DrugMarketProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketVariant" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "countryCode" TEXT NOT NULL,
    "sourceId" UUID,
    "tradeName" TEXT NOT NULL,
    "genericName" TEXT,
    "strengthText" TEXT,
    "strengthValue" DECIMAL(12,4),
    "strengthUnit" TEXT,
    "dosageForm" TEXT,
    "route" TEXT,
    "packageText" TEXT,
    "manufacturer" TEXT,
    "marketingCompany" TEXT,
    "registrationNumber" TEXT,
    "legalStatus" TEXT,
    "authorizationStatus" TEXT,
    "atcCode" TEXT,
    "priceText" TEXT,
    "currency" TEXT,
    "sourceRowHash" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DrugMarketVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketAvailability" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "countryCode" TEXT NOT NULL,
    "variantCount" INTEGER NOT NULL DEFAULT 0,
    "compactBadgeLabel" TEXT,
    "showCompactBadge" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugMarketAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketImportJob" (
    "id" UUID NOT NULL,
    "sourceId" UUID,
    "status" TEXT NOT NULL DEFAULT 'needs_review',
    "fileName" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "requestedByUserId" UUID,
    "summaryText" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DrugMarketImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketImportRowError" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "rowHash" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugMarketImportRowError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketManualReviewQueue" (
    "id" UUID NOT NULL,
    "queueType" TEXT NOT NULL,
    "productId" UUID,
    "variantId" UUID,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reason" TEXT NOT NULL,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DrugMarketManualReviewQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketSearchLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "query" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "countryCode" TEXT,
    "resultCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugMarketSearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketImportRun" (
    "id" UUID NOT NULL,
    "connectorId" UUID,
    "sourceId" UUID,
    "status" TEXT NOT NULL DEFAULT 'needs_review',
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" UUID,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "DrugMarketImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketSourceConnector" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "sourceId" UUID,
    "connectorType" TEXT NOT NULL,
    "countryCode" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "policyStatus" TEXT NOT NULL DEFAULT 'approved',
    "isRetailMetadata" BOOLEAN NOT NULL DEFAULT false,
    "baseUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DrugMarketSourceConnector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugMarketMergeCandidate" (
    "id" UUID NOT NULL,
    "primaryProductId" UUID,
    "candidateProductId" UUID,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DrugMarketMergeCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DrugFamily_code_key" ON "DrugFamily"("code");

-- CreateIndex
CREATE INDEX "DrugFamily_code_idx" ON "DrugFamily"("code");

-- CreateIndex
CREATE INDEX "DrugFamily_displayName_idx" ON "DrugFamily"("displayName");

-- CreateIndex
CREATE INDEX "DrugFamily_normalizedSearchText_idx" ON "DrugFamily"("normalizedSearchText");

-- CreateIndex
CREATE INDEX "DrugFamily_verificationStatus_idx" ON "DrugFamily"("verificationStatus");

-- CreateIndex
CREATE INDEX "MedicationIngredient_genericName_idx" ON "MedicationIngredient"("genericName");

-- CreateIndex
CREATE INDEX "MedicationIngredient_normalizedSearchText_idx" ON "MedicationIngredient"("normalizedSearchText");

-- CreateIndex
CREATE INDEX "MedicationIngredient_atcCode_idx" ON "MedicationIngredient"("atcCode");

-- CreateIndex
CREATE INDEX "MedicationIngredient_rxCui_idx" ON "MedicationIngredient"("rxCui");

-- CreateIndex
CREATE INDEX "MedicationIngredient_verificationStatus_idx" ON "MedicationIngredient"("verificationStatus");

-- CreateIndex
CREATE INDEX "MedicationFamilyMembership_familyId_idx" ON "MedicationFamilyMembership"("familyId");

-- CreateIndex
CREATE INDEX "MedicationFamilyMembership_sourceStatus_idx" ON "MedicationFamilyMembership"("sourceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationFamilyMembership_ingredientId_familyId_key" ON "MedicationFamilyMembership"("ingredientId", "familyId");

-- CreateIndex
CREATE INDEX "MedicationProduct_ingredientId_idx" ON "MedicationProduct"("ingredientId");

-- CreateIndex
CREATE INDEX "MedicationProduct_genericName_idx" ON "MedicationProduct"("genericName");

-- CreateIndex
CREATE INDEX "MedicationProduct_brandName_idx" ON "MedicationProduct"("brandName");

-- CreateIndex
CREATE INDEX "MedicationProduct_normalizedSearchText_idx" ON "MedicationProduct"("normalizedSearchText");

-- CreateIndex
CREATE INDEX "MedicationProduct_dosageForm_idx" ON "MedicationProduct"("dosageForm");

-- CreateIndex
CREATE INDEX "MedicationProduct_strengthText_idx" ON "MedicationProduct"("strengthText");

-- CreateIndex
CREATE INDEX "MedicationProduct_verificationStatus_idx" ON "MedicationProduct"("verificationStatus");

-- CreateIndex
CREATE INDEX "MedicationLabelSection_ingredientId_idx" ON "MedicationLabelSection"("ingredientId");

-- CreateIndex
CREATE INDEX "MedicationLabelSection_productId_idx" ON "MedicationLabelSection"("productId");

-- CreateIndex
CREATE INDEX "MedicationLabelSection_sectionType_idx" ON "MedicationLabelSection"("sectionType");

-- CreateIndex
CREATE INDEX "MedicationLabelSection_verificationStatus_idx" ON "MedicationLabelSection"("verificationStatus");

-- CreateIndex
CREATE INDEX "MedicationInteractionRule_ruleType_idx" ON "MedicationInteractionRule"("ruleType");

-- CreateIndex
CREATE INDEX "MedicationInteractionRule_severity_idx" ON "MedicationInteractionRule"("severity");

-- CreateIndex
CREATE INDEX "MedicationInteractionRule_primaryIngredientId_idx" ON "MedicationInteractionRule"("primaryIngredientId");

-- CreateIndex
CREATE INDEX "MedicationInteractionRule_secondaryIngredientId_idx" ON "MedicationInteractionRule"("secondaryIngredientId");

-- CreateIndex
CREATE INDEX "MedicationInteractionRule_primaryFamilyId_idx" ON "MedicationInteractionRule"("primaryFamilyId");

-- CreateIndex
CREATE INDEX "MedicationInteractionRule_secondaryFamilyId_idx" ON "MedicationInteractionRule"("secondaryFamilyId");

-- CreateIndex
CREATE INDEX "MedicationInteractionRule_herbalProductId_idx" ON "MedicationInteractionRule"("herbalProductId");

-- CreateIndex
CREATE INDEX "MedicationInteractionRule_verificationStatus_idx" ON "MedicationInteractionRule"("verificationStatus");

-- CreateIndex
CREATE INDEX "HerbalProduct_commonName_idx" ON "HerbalProduct"("commonName");

-- CreateIndex
CREATE INDEX "HerbalProduct_botanicalName_idx" ON "HerbalProduct"("botanicalName");

-- CreateIndex
CREATE INDEX "HerbalProduct_normalizedSearchText_idx" ON "HerbalProduct"("normalizedSearchText");

-- CreateIndex
CREATE INDEX "HerbalProduct_verificationStatus_idx" ON "HerbalProduct"("verificationStatus");

-- CreateIndex
CREATE INDEX "PatientAllergy_patientId_status_idx" ON "PatientAllergy"("patientId", "status");

-- CreateIndex
CREATE INDEX "PatientAllergy_ingredientId_idx" ON "PatientAllergy"("ingredientId");

-- CreateIndex
CREATE INDEX "PatientAllergy_familyId_idx" ON "PatientAllergy"("familyId");

-- CreateIndex
CREATE INDEX "PatientAllergy_herbalProductId_idx" ON "PatientAllergy"("herbalProductId");

-- CreateIndex
CREATE INDEX "PatientMedication_patientId_status_idx" ON "PatientMedication"("patientId", "status");

-- CreateIndex
CREATE INDEX "PatientMedication_medicationProductId_idx" ON "PatientMedication"("medicationProductId");

-- CreateIndex
CREATE INDEX "PatientMedication_drugMarketVariantId_idx" ON "PatientMedication"("drugMarketVariantId");

-- CreateIndex
CREATE INDEX "PatientMedication_herbalProductId_idx" ON "PatientMedication"("herbalProductId");

-- CreateIndex
CREATE INDEX "PatientMedication_genericName_idx" ON "PatientMedication"("genericName");

-- CreateIndex
CREATE INDEX "MedicationSafetyCheck_patientId_status_idx" ON "MedicationSafetyCheck"("patientId", "status");

-- CreateIndex
CREATE INDEX "MedicationSafetyCheck_prescriptionId_idx" ON "MedicationSafetyCheck"("prescriptionId");

-- CreateIndex
CREATE INDEX "MedicationSafetyCheck_createdAt_idx" ON "MedicationSafetyCheck"("createdAt");

-- CreateIndex
CREATE INDEX "MedicationSafetyAlert_safetyCheckId_severity_idx" ON "MedicationSafetyAlert"("safetyCheckId", "severity");

-- CreateIndex
CREATE INDEX "MedicationSafetyAlert_status_idx" ON "MedicationSafetyAlert"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationDataSource_code_key" ON "MedicationDataSource"("code");

-- CreateIndex
CREATE INDEX "MedicationDataSource_sourceType_idx" ON "MedicationDataSource"("sourceType");

-- CreateIndex
CREATE INDEX "MedicationDataSource_verificationStatus_idx" ON "MedicationDataSource"("verificationStatus");

-- CreateIndex
CREATE INDEX "MedicationDataSource_active_idx" ON "MedicationDataSource"("active");

-- CreateIndex
CREATE INDEX "MedicationDataImportJob_sourceId_idx" ON "MedicationDataImportJob"("sourceId");

-- CreateIndex
CREATE INDEX "MedicationDataImportJob_status_idx" ON "MedicationDataImportJob"("status");

-- CreateIndex
CREATE INDEX "MedicationDataImportJob_createdAt_idx" ON "MedicationDataImportJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DrugMarketCountry_countryCode_key" ON "DrugMarketCountry"("countryCode");

-- CreateIndex
CREATE INDEX "DrugMarketCountry_countryCode_idx" ON "DrugMarketCountry"("countryCode");

-- CreateIndex
CREATE INDEX "DrugMarketCountry_active_idx" ON "DrugMarketCountry"("active");

-- CreateIndex
CREATE UNIQUE INDEX "DrugMarketSource_code_key" ON "DrugMarketSource"("code");

-- CreateIndex
CREATE INDEX "DrugMarketSource_countryCode_idx" ON "DrugMarketSource"("countryCode");

-- CreateIndex
CREATE INDEX "DrugMarketSource_sourceType_idx" ON "DrugMarketSource"("sourceType");

-- CreateIndex
CREATE INDEX "DrugMarketSource_policyStatus_idx" ON "DrugMarketSource"("policyStatus");

-- CreateIndex
CREATE INDEX "DrugMarketSource_verificationStatus_idx" ON "DrugMarketSource"("verificationStatus");

-- CreateIndex
CREATE INDEX "DrugMarketProduct_tradeName_idx" ON "DrugMarketProduct"("tradeName");

-- CreateIndex
CREATE INDEX "DrugMarketProduct_genericName_idx" ON "DrugMarketProduct"("genericName");

-- CreateIndex
CREATE INDEX "DrugMarketProduct_normalizedSearchText_idx" ON "DrugMarketProduct"("normalizedSearchText");

-- CreateIndex
CREATE INDEX "DrugMarketProduct_verificationStatus_idx" ON "DrugMarketProduct"("verificationStatus");

-- CreateIndex
CREATE INDEX "DrugMarketVariant_productId_idx" ON "DrugMarketVariant"("productId");

-- CreateIndex
CREATE INDEX "DrugMarketVariant_countryCode_idx" ON "DrugMarketVariant"("countryCode");

-- CreateIndex
CREATE INDEX "DrugMarketVariant_tradeName_idx" ON "DrugMarketVariant"("tradeName");

-- CreateIndex
CREATE INDEX "DrugMarketVariant_genericName_idx" ON "DrugMarketVariant"("genericName");

-- CreateIndex
CREATE INDEX "DrugMarketVariant_strengthText_idx" ON "DrugMarketVariant"("strengthText");

-- CreateIndex
CREATE INDEX "DrugMarketVariant_dosageForm_idx" ON "DrugMarketVariant"("dosageForm");

-- CreateIndex
CREATE INDEX "DrugMarketVariant_registrationNumber_idx" ON "DrugMarketVariant"("registrationNumber");

-- CreateIndex
CREATE INDEX "DrugMarketVariant_verificationStatus_idx" ON "DrugMarketVariant"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DrugMarketVariant_countryCode_sourceRowHash_key" ON "DrugMarketVariant"("countryCode", "sourceRowHash");

-- CreateIndex
CREATE INDEX "DrugMarketAvailability_countryCode_idx" ON "DrugMarketAvailability"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "DrugMarketAvailability_productId_countryCode_key" ON "DrugMarketAvailability"("productId", "countryCode");

-- CreateIndex
CREATE INDEX "DrugMarketImportJob_sourceId_idx" ON "DrugMarketImportJob"("sourceId");

-- CreateIndex
CREATE INDEX "DrugMarketImportJob_status_idx" ON "DrugMarketImportJob"("status");

-- CreateIndex
CREATE INDEX "DrugMarketImportJob_createdAt_idx" ON "DrugMarketImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "DrugMarketImportRowError_jobId_idx" ON "DrugMarketImportRowError"("jobId");

-- CreateIndex
CREATE INDEX "DrugMarketImportRowError_rowHash_idx" ON "DrugMarketImportRowError"("rowHash");

-- CreateIndex
CREATE INDEX "DrugMarketManualReviewQueue_queueType_idx" ON "DrugMarketManualReviewQueue"("queueType");

-- CreateIndex
CREATE INDEX "DrugMarketManualReviewQueue_status_idx" ON "DrugMarketManualReviewQueue"("status");

-- CreateIndex
CREATE INDEX "DrugMarketManualReviewQueue_productId_idx" ON "DrugMarketManualReviewQueue"("productId");

-- CreateIndex
CREATE INDEX "DrugMarketManualReviewQueue_variantId_idx" ON "DrugMarketManualReviewQueue"("variantId");

-- CreateIndex
CREATE INDEX "DrugMarketSearchLog_userId_createdAt_idx" ON "DrugMarketSearchLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DrugMarketSearchLog_countryCode_idx" ON "DrugMarketSearchLog"("countryCode");

-- CreateIndex
CREATE INDEX "DrugMarketImportRun_connectorId_idx" ON "DrugMarketImportRun"("connectorId");

-- CreateIndex
CREATE INDEX "DrugMarketImportRun_sourceId_idx" ON "DrugMarketImportRun"("sourceId");

-- CreateIndex
CREATE INDEX "DrugMarketImportRun_status_idx" ON "DrugMarketImportRun"("status");

-- CreateIndex
CREATE INDEX "DrugMarketImportRun_startedAt_idx" ON "DrugMarketImportRun"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DrugMarketSourceConnector_code_key" ON "DrugMarketSourceConnector"("code");

-- CreateIndex
CREATE INDEX "DrugMarketSourceConnector_sourceId_idx" ON "DrugMarketSourceConnector"("sourceId");

-- CreateIndex
CREATE INDEX "DrugMarketSourceConnector_connectorType_idx" ON "DrugMarketSourceConnector"("connectorType");

-- CreateIndex
CREATE INDEX "DrugMarketSourceConnector_countryCode_idx" ON "DrugMarketSourceConnector"("countryCode");

-- CreateIndex
CREATE INDEX "DrugMarketSourceConnector_enabled_idx" ON "DrugMarketSourceConnector"("enabled");

-- CreateIndex
CREATE INDEX "DrugMarketSourceConnector_policyStatus_idx" ON "DrugMarketSourceConnector"("policyStatus");

-- CreateIndex
CREATE INDEX "DrugMarketSourceConnector_isRetailMetadata_idx" ON "DrugMarketSourceConnector"("isRetailMetadata");

-- CreateIndex
CREATE INDEX "DrugMarketMergeCandidate_primaryProductId_idx" ON "DrugMarketMergeCandidate"("primaryProductId");

-- CreateIndex
CREATE INDEX "DrugMarketMergeCandidate_candidateProductId_idx" ON "DrugMarketMergeCandidate"("candidateProductId");

-- CreateIndex
CREATE INDEX "DrugMarketMergeCandidate_status_idx" ON "DrugMarketMergeCandidate"("status");

-- CreateIndex
CREATE INDEX "PrescriptionItem_medicationProductId_idx" ON "PrescriptionItem"("medicationProductId");

-- CreateIndex
CREATE INDEX "PrescriptionItem_drugMarketVariantId_idx" ON "PrescriptionItem"("drugMarketVariantId");

-- AddForeignKey
ALTER TABLE "MedicationFamilyMembership" ADD CONSTRAINT "MedicationFamilyMembership_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "MedicationIngredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationFamilyMembership" ADD CONSTRAINT "MedicationFamilyMembership_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "DrugFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationProduct" ADD CONSTRAINT "MedicationProduct_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "MedicationIngredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationLabelSection" ADD CONSTRAINT "MedicationLabelSection_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "MedicationIngredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationLabelSection" ADD CONSTRAINT "MedicationLabelSection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MedicationProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedication" ADD CONSTRAINT "PatientMedication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationSafetyCheck" ADD CONSTRAINT "MedicationSafetyCheck_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationSafetyAlert" ADD CONSTRAINT "MedicationSafetyAlert_safetyCheckId_fkey" FOREIGN KEY ("safetyCheckId") REFERENCES "MedicationSafetyCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugMarketVariant" ADD CONSTRAINT "DrugMarketVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DrugMarketProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugMarketAvailability" ADD CONSTRAINT "DrugMarketAvailability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DrugMarketProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugMarketAvailability" ADD CONSTRAINT "DrugMarketAvailability_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "DrugMarketCountry"("countryCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugMarketImportRowError" ADD CONSTRAINT "DrugMarketImportRowError_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "DrugMarketImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
