-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('uploaded', 'review_pending', 'reviewed', 'voided');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('laboratory', 'radiology', 'ultrasound', 'pathology', 'cytology', 'external', 'other');

-- CreateEnum
CREATE TYPE "PregnancyStatus" AS ENUM ('active', 'completed', 'loss', 'unknown');

-- CreateEnum
CREATE TYPE "ObUltrasoundStatus" AS ENUM ('draft', 'reviewed', 'voided');

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "branchId" UUID,
    "patientId" UUID NOT NULL,
    "encounterId" UUID,
    "investigationOrderId" UUID,
    "category" "ReportCategory" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'uploaded',
    "title" TEXT NOT NULL,
    "source" TEXT,
    "fileReference" TEXT,
    "resultSummary" TEXT,
    "uploadedByUserId" UUID,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pregnancy" (
    "id" UUID NOT NULL,
    "branchId" UUID,
    "patientId" UUID NOT NULL,
    "status" "PregnancyStatus" NOT NULL DEFAULT 'active',
    "gravida" INTEGER,
    "para" INTEGER,
    "lmpDate" DATE,
    "estimatedDueDate" DATE,
    "riskLevel" TEXT,
    "notes" TEXT,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Pregnancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObUltrasound" (
    "id" UUID NOT NULL,
    "branchId" UUID,
    "patientId" UUID NOT NULL,
    "pregnancyId" UUID,
    "encounterId" UUID,
    "status" "ObUltrasoundStatus" NOT NULL DEFAULT 'draft',
    "performedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gestationalAgeWeeks" INTEGER,
    "gestationalAgeDays" INTEGER,
    "fetalHeartRateBpm" INTEGER,
    "presentation" TEXT,
    "placenta" TEXT,
    "amnioticFluid" TEXT,
    "impressionText" TEXT,
    "createdByUserId" UUID,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ObUltrasound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_branchId_idx" ON "Report"("branchId");

-- CreateIndex
CREATE INDEX "Report_patientId_createdAt_idx" ON "Report"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_encounterId_idx" ON "Report"("encounterId");

-- CreateIndex
CREATE INDEX "Report_investigationOrderId_idx" ON "Report"("investigationOrderId");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Pregnancy_branchId_idx" ON "Pregnancy"("branchId");

-- CreateIndex
CREATE INDEX "Pregnancy_patientId_createdAt_idx" ON "Pregnancy"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Pregnancy_status_idx" ON "Pregnancy"("status");

-- CreateIndex
CREATE INDEX "ObUltrasound_branchId_idx" ON "ObUltrasound"("branchId");

-- CreateIndex
CREATE INDEX "ObUltrasound_patientId_performedAt_idx" ON "ObUltrasound"("patientId", "performedAt");

-- CreateIndex
CREATE INDEX "ObUltrasound_pregnancyId_idx" ON "ObUltrasound"("pregnancyId");

-- CreateIndex
CREATE INDEX "ObUltrasound_encounterId_idx" ON "ObUltrasound"("encounterId");

-- CreateIndex
CREATE INDEX "ObUltrasound_status_idx" ON "ObUltrasound"("status");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_investigationOrderId_fkey" FOREIGN KEY ("investigationOrderId") REFERENCES "InvestigationOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregnancy" ADD CONSTRAINT "Pregnancy_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregnancy" ADD CONSTRAINT "Pregnancy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregnancy" ADD CONSTRAINT "Pregnancy_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObUltrasound" ADD CONSTRAINT "ObUltrasound_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObUltrasound" ADD CONSTRAINT "ObUltrasound_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObUltrasound" ADD CONSTRAINT "ObUltrasound_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "Pregnancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObUltrasound" ADD CONSTRAINT "ObUltrasound_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObUltrasound" ADD CONSTRAINT "ObUltrasound_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObUltrasound" ADD CONSTRAINT "ObUltrasound_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
