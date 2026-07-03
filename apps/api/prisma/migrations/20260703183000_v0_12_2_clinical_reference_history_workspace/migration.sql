-- v0.12.2 clinical reference catalogs + patient history workspace.
-- Reference-only generic medication lookup, catalog-linked history snapshots,
-- and generic-name prescription selection. No pricing, stock, inventory, sales,
-- dosing automation, or brand/trade medication catalog fields are added here.

CREATE TABLE "MedicationGeneric" (
    "id" UUID NOT NULL,
    "genericName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "familyName" TEXT,
    "className" TEXT,
    "pharmacologicClass" TEXT,
    "parentClass" TEXT,
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "isAntibiotic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceType" TEXT NOT NULL DEFAULT 'curated_reference',
    "reviewStatus" TEXT NOT NULL DEFAULT 'reviewed',
    "aliases" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationGeneric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MedicationSearchTag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aliases" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationSearchTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MedicationGenericTag" (
    "medicationGenericId" UUID NOT NULL,
    "medicationSearchTagId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationGenericTag_pkey" PRIMARY KEY ("medicationGenericId","medicationSearchTagId")
);

CREATE TABLE "MedicationClass" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "parentId" UUID,
    "type" TEXT NOT NULL,
    "aliases" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicationClass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientHistorySheet" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "chiefComplaint" TEXT,
    "historyOfPresentIllness" TEXT,
    "menstrualHistory" JSONB,
    "obstetricHistory" JSONB,
    "gynecologicalHistory" JSONB,
    "contraceptionHistory" JSONB,
    "infertilityHistory" JSONB,
    "pastMedicalHistory" JSONB,
    "allergyHistory" JSONB,
    "familyHistory" JSONB,
    "socialHistory" JSONB,
    "notes" TEXT,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PatientHistorySheet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientOperationHistoryItem" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "historySheetId" UUID,
    "operationCatalogItemId" UUID,
    "operationNameSnapshot" TEXT NOT NULL,
    "approximateDate" DATE,
    "year" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PatientOperationHistoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientMedicationHistoryItem" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "historySheetId" UUID,
    "medicationGenericId" UUID,
    "genericNameSnapshot" TEXT NOT NULL,
    "familyNameSnapshot" TEXT,
    "currentOrPast" TEXT NOT NULL DEFAULT 'past',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PatientMedicationHistoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientInvestigationHistoryItem" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "historySheetId" UUID,
    "investigationCatalogItemId" UUID,
    "investigationNameSnapshot" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'previous',
    "date" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PatientInvestigationHistoryItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PrescriptionItem" ADD COLUMN "medicationGenericId" UUID;

CREATE UNIQUE INDEX "MedicationGeneric_normalizedName_key" ON "MedicationGeneric"("normalizedName");
CREATE INDEX "MedicationGeneric_genericName_idx" ON "MedicationGeneric"("genericName");
CREATE INDEX "MedicationGeneric_familyName_idx" ON "MedicationGeneric"("familyName");
CREATE INDEX "MedicationGeneric_className_idx" ON "MedicationGeneric"("className");
CREATE INDEX "MedicationGeneric_pharmacologicClass_idx" ON "MedicationGeneric"("pharmacologicClass");
CREATE INDEX "MedicationGeneric_isControlled_idx" ON "MedicationGeneric"("isControlled");
CREATE INDEX "MedicationGeneric_isAntibiotic_idx" ON "MedicationGeneric"("isAntibiotic");
CREATE INDEX "MedicationGeneric_isActive_idx" ON "MedicationGeneric"("isActive");
CREATE INDEX "MedicationGeneric_reviewStatus_idx" ON "MedicationGeneric"("reviewStatus");

CREATE UNIQUE INDEX "MedicationSearchTag_normalizedName_key" ON "MedicationSearchTag"("normalizedName");
CREATE INDEX "MedicationSearchTag_type_idx" ON "MedicationSearchTag"("type");
CREATE INDEX "MedicationSearchTag_isActive_idx" ON "MedicationSearchTag"("isActive");

CREATE INDEX "MedicationGenericTag_medicationSearchTagId_idx" ON "MedicationGenericTag"("medicationSearchTagId");

CREATE UNIQUE INDEX "MedicationClass_normalizedName_key" ON "MedicationClass"("normalizedName");
CREATE INDEX "MedicationClass_parentId_idx" ON "MedicationClass"("parentId");
CREATE INDEX "MedicationClass_type_idx" ON "MedicationClass"("type");
CREATE INDEX "MedicationClass_isActive_idx" ON "MedicationClass"("isActive");

CREATE INDEX "PrescriptionItem_medicationGenericId_idx" ON "PrescriptionItem"("medicationGenericId");

CREATE INDEX "PatientHistorySheet_patientId_createdAt_idx" ON "PatientHistorySheet"("patientId", "createdAt");
CREATE INDEX "PatientHistorySheet_status_idx" ON "PatientHistorySheet"("status");
CREATE INDEX "PatientHistorySheet_createdByUserId_idx" ON "PatientHistorySheet"("createdByUserId");
CREATE INDEX "PatientHistorySheet_updatedByUserId_idx" ON "PatientHistorySheet"("updatedByUserId");

CREATE INDEX "PatientOperationHistoryItem_patientId_createdAt_idx" ON "PatientOperationHistoryItem"("patientId", "createdAt");
CREATE INDEX "PatientOperationHistoryItem_historySheetId_idx" ON "PatientOperationHistoryItem"("historySheetId");
CREATE INDEX "PatientOperationHistoryItem_operationCatalogItemId_idx" ON "PatientOperationHistoryItem"("operationCatalogItemId");

CREATE INDEX "PatientMedicationHistoryItem_patientId_createdAt_idx" ON "PatientMedicationHistoryItem"("patientId", "createdAt");
CREATE INDEX "PatientMedicationHistoryItem_historySheetId_idx" ON "PatientMedicationHistoryItem"("historySheetId");
CREATE INDEX "PatientMedicationHistoryItem_medicationGenericId_idx" ON "PatientMedicationHistoryItem"("medicationGenericId");
CREATE INDEX "PatientMedicationHistoryItem_currentOrPast_idx" ON "PatientMedicationHistoryItem"("currentOrPast");

CREATE INDEX "PatientInvestigationHistoryItem_patientId_createdAt_idx" ON "PatientInvestigationHistoryItem"("patientId", "createdAt");
CREATE INDEX "PatientInvestigationHistoryItem_historySheetId_idx" ON "PatientInvestigationHistoryItem"("historySheetId");
CREATE INDEX "PatientInvestigationHistoryItem_investigationCatalogItemId_idx" ON "PatientInvestigationHistoryItem"("investigationCatalogItemId");
CREATE INDEX "PatientInvestigationHistoryItem_context_idx" ON "PatientInvestigationHistoryItem"("context");

ALTER TABLE "MedicationGenericTag" ADD CONSTRAINT "MedicationGenericTag_medicationGenericId_fkey" FOREIGN KEY ("medicationGenericId") REFERENCES "MedicationGeneric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicationGenericTag" ADD CONSTRAINT "MedicationGenericTag_medicationSearchTagId_fkey" FOREIGN KEY ("medicationSearchTagId") REFERENCES "MedicationSearchTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicationClass" ADD CONSTRAINT "MedicationClass_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MedicationClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_medicationGenericId_fkey" FOREIGN KEY ("medicationGenericId") REFERENCES "MedicationGeneric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PatientHistorySheet" ADD CONSTRAINT "PatientHistorySheet_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientHistorySheet" ADD CONSTRAINT "PatientHistorySheet_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientHistorySheet" ADD CONSTRAINT "PatientHistorySheet_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PatientOperationHistoryItem" ADD CONSTRAINT "PatientOperationHistoryItem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientOperationHistoryItem" ADD CONSTRAINT "PatientOperationHistoryItem_historySheetId_fkey" FOREIGN KEY ("historySheetId") REFERENCES "PatientHistorySheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientOperationHistoryItem" ADD CONSTRAINT "PatientOperationHistoryItem_operationCatalogItemId_fkey" FOREIGN KEY ("operationCatalogItemId") REFERENCES "OperationCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PatientMedicationHistoryItem" ADD CONSTRAINT "PatientMedicationHistoryItem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientMedicationHistoryItem" ADD CONSTRAINT "PatientMedicationHistoryItem_historySheetId_fkey" FOREIGN KEY ("historySheetId") REFERENCES "PatientHistorySheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientMedicationHistoryItem" ADD CONSTRAINT "PatientMedicationHistoryItem_medicationGenericId_fkey" FOREIGN KEY ("medicationGenericId") REFERENCES "MedicationGeneric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PatientInvestigationHistoryItem" ADD CONSTRAINT "PatientInvestigationHistoryItem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientInvestigationHistoryItem" ADD CONSTRAINT "PatientInvestigationHistoryItem_historySheetId_fkey" FOREIGN KEY ("historySheetId") REFERENCES "PatientHistorySheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientInvestigationHistoryItem" ADD CONSTRAINT "PatientInvestigationHistoryItem_investigationCatalogItemId_fkey" FOREIGN KEY ("investigationCatalogItemId") REFERENCES "InvestigationCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
