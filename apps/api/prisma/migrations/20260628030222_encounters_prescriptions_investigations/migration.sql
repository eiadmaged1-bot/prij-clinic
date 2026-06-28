-- CreateEnum
CREATE TYPE "EncounterStatus" AS ENUM ('draft', 'signed', 'voided');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('draft', 'signed', 'cancelled', 'voided');

-- CreateEnum
CREATE TYPE "InvestigationOrderStatus" AS ENUM ('requested', 'scheduled', 'sample_collected', 'sent_out', 'result_pending', 'result_received', 'reviewed', 'cancelled', 'voided');

-- CreateEnum
CREATE TYPE "InvestigationPriority" AS ENUM ('routine', 'urgent');

-- CreateEnum
CREATE TYPE "InvestigationCategory" AS ENUM ('laboratory', 'radiology', 'ultrasound', 'pathology', 'cytology', 'procedure', 'other');

-- CreateTable
CREATE TABLE "Encounter" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "appointmentId" UUID,
    "doctorId" UUID NOT NULL,
    "status" "EncounterStatus" NOT NULL DEFAULT 'draft',
    "chiefComplaint" TEXT,
    "historyText" TEXT,
    "examText" TEXT,
    "assessmentText" TEXT,
    "planText" TEXT,
    "signedAt" TIMESTAMPTZ(3),
    "signedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "encounterId" UUID,
    "doctorId" UUID NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "signedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" UUID NOT NULL,
    "prescriptionId" UUID NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dose" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationOrder" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "encounterId" UUID,
    "doctorId" UUID NOT NULL,
    "status" "InvestigationOrderStatus" NOT NULL DEFAULT 'requested',
    "priority" "InvestigationPriority" NOT NULL DEFAULT 'routine',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "InvestigationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationOrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "category" "InvestigationCategory" NOT NULL,
    "testName" TEXT NOT NULL,
    "instructions" TEXT,
    "status" "InvestigationOrderStatus" NOT NULL DEFAULT 'requested',

    CONSTRAINT "InvestigationOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Encounter_patientId_createdAt_idx" ON "Encounter"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Encounter_doctorId_createdAt_idx" ON "Encounter"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "Encounter_appointmentId_idx" ON "Encounter"("appointmentId");

-- CreateIndex
CREATE INDEX "Encounter_status_idx" ON "Encounter"("status");

-- CreateIndex
CREATE INDEX "Prescription_patientId_createdAt_idx" ON "Prescription"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_encounterId_idx" ON "Prescription"("encounterId");

-- CreateIndex
CREATE INDEX "Prescription_doctorId_createdAt_idx" ON "Prescription"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");

-- CreateIndex
CREATE INDEX "InvestigationOrder_patientId_createdAt_idx" ON "InvestigationOrder"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "InvestigationOrder_encounterId_idx" ON "InvestigationOrder"("encounterId");

-- CreateIndex
CREATE INDEX "InvestigationOrder_doctorId_createdAt_idx" ON "InvestigationOrder"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "InvestigationOrder_status_idx" ON "InvestigationOrder"("status");

-- CreateIndex
CREATE INDEX "InvestigationOrderItem_orderId_idx" ON "InvestigationOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "InvestigationOrderItem_category_idx" ON "InvestigationOrderItem"("category");

-- CreateIndex
CREATE INDEX "InvestigationOrderItem_status_idx" ON "InvestigationOrderItem"("status");

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_signedByUserId_fkey" FOREIGN KEY ("signedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationOrder" ADD CONSTRAINT "InvestigationOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationOrder" ADD CONSTRAINT "InvestigationOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationOrder" ADD CONSTRAINT "InvestigationOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationOrderItem" ADD CONSTRAINT "InvestigationOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "InvestigationOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
