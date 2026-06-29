-- AlterTable
ALTER TABLE "Pregnancy" ADD COLUMN     "abortions" INTEGER,
ADD COLUMN     "datingMethod" TEXT,
ADD COLUMN     "living" INTEGER;

-- CreateTable
CREATE TABLE "PregnancyFetus" (
    "id" UUID NOT NULL,
    "pregnancyId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "chorionicity" TEXT,
    "amnionicity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PregnancyFetus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AntenatalVisit" (
    "id" UUID NOT NULL,
    "branchId" UUID,
    "patientId" UUID NOT NULL,
    "pregnancyId" UUID NOT NULL,
    "visitDate" DATE NOT NULL,
    "gestationalAgeDisplay" TEXT,
    "bloodPressure" TEXT,
    "weightKg" DECIMAL(6,2),
    "symptomsText" TEXT,
    "fetalHeartText" TEXT,
    "planText" TEXT,
    "nextFollowUpDate" DATE,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AntenatalVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PregnancyFetus_pregnancyId_idx" ON "PregnancyFetus"("pregnancyId");

-- CreateIndex
CREATE INDEX "PregnancyFetus_status_idx" ON "PregnancyFetus"("status");

-- CreateIndex
CREATE INDEX "AntenatalVisit_branchId_idx" ON "AntenatalVisit"("branchId");

-- CreateIndex
CREATE INDEX "AntenatalVisit_patientId_visitDate_idx" ON "AntenatalVisit"("patientId", "visitDate");

-- CreateIndex
CREATE INDEX "AntenatalVisit_pregnancyId_visitDate_idx" ON "AntenatalVisit"("pregnancyId", "visitDate");

-- AddForeignKey
ALTER TABLE "PregnancyFetus" ADD CONSTRAINT "PregnancyFetus_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "Pregnancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AntenatalVisit" ADD CONSTRAINT "AntenatalVisit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AntenatalVisit" ADD CONSTRAINT "AntenatalVisit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AntenatalVisit" ADD CONSTRAINT "AntenatalVisit_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "Pregnancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
