-- CreateTable
CREATE TABLE "ClinicalProtocol" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "specialtyGroup" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "aliases" JSONB NOT NULL,
    "bodySystem" TEXT,
    "clinicalArea" TEXT,
    "protocolType" TEXT NOT NULL DEFAULT 'management_snapshot',
    "implementationStatus" TEXT NOT NULL DEFAULT 'catalog_only',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "sourceName" TEXT NOT NULL,
    "sourceYear" INTEGER,
    "sourceUrl" TEXT,
    "sourceVersion" TEXT,
    "contentJson" JSONB NOT NULL,
    "safetyJson" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClinicalProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIManagementSnapshot" (
    "id" TEXT NOT NULL,
    "patientId" UUID NOT NULL,
    "encounterId" UUID,
    "protocolId" TEXT,
    "diagnosisText" TEXT NOT NULL,
    "clinicalGoal" TEXT,
    "inputContextJson" JSONB NOT NULL,
    "outputJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "doctorDecision" TEXT,
    "doctorEditedPlan" TEXT,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AIManagementSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientClinicalMemory" (
    "id" TEXT NOT NULL,
    "patientId" UUID NOT NULL,
    "memoryType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "sourceSnapshotId" TEXT,
    "approvedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PatientClinicalMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalProtocol_code_key" ON "ClinicalProtocol"("code");
CREATE INDEX "ClinicalProtocol_specialtyGroup_idx" ON "ClinicalProtocol"("specialtyGroup");
CREATE INDEX "ClinicalProtocol_condition_idx" ON "ClinicalProtocol"("condition");
CREATE INDEX "ClinicalProtocol_implementationStatus_idx" ON "ClinicalProtocol"("implementationStatus");
CREATE INDEX "ClinicalProtocol_riskLevel_idx" ON "ClinicalProtocol"("riskLevel");
CREATE INDEX "AIManagementSnapshot_patientId_createdAt_idx" ON "AIManagementSnapshot"("patientId", "createdAt");
CREATE INDEX "AIManagementSnapshot_encounterId_idx" ON "AIManagementSnapshot"("encounterId");
CREATE INDEX "AIManagementSnapshot_protocolId_idx" ON "AIManagementSnapshot"("protocolId");
CREATE INDEX "AIManagementSnapshot_status_idx" ON "AIManagementSnapshot"("status");
CREATE INDEX "AIManagementSnapshot_createdByUserId_idx" ON "AIManagementSnapshot"("createdByUserId");
CREATE INDEX "AIManagementSnapshot_reviewedByUserId_idx" ON "AIManagementSnapshot"("reviewedByUserId");
CREATE INDEX "PatientClinicalMemory_patientId_createdAt_idx" ON "PatientClinicalMemory"("patientId", "createdAt");
CREATE INDEX "PatientClinicalMemory_memoryType_idx" ON "PatientClinicalMemory"("memoryType");
CREATE INDEX "PatientClinicalMemory_sourceSnapshotId_idx" ON "PatientClinicalMemory"("sourceSnapshotId");
CREATE INDEX "PatientClinicalMemory_approvedByUserId_idx" ON "PatientClinicalMemory"("approvedByUserId");

-- AddForeignKey
ALTER TABLE "AIManagementSnapshot" ADD CONSTRAINT "AIManagementSnapshot_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIManagementSnapshot" ADD CONSTRAINT "AIManagementSnapshot_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIManagementSnapshot" ADD CONSTRAINT "AIManagementSnapshot_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "ClinicalProtocol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIManagementSnapshot" ADD CONSTRAINT "AIManagementSnapshot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIManagementSnapshot" ADD CONSTRAINT "AIManagementSnapshot_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalMemory" ADD CONSTRAINT "PatientClinicalMemory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalMemory" ADD CONSTRAINT "PatientClinicalMemory_sourceSnapshotId_fkey" FOREIGN KEY ("sourceSnapshotId") REFERENCES "AIManagementSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalMemory" ADD CONSTRAINT "PatientClinicalMemory_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
