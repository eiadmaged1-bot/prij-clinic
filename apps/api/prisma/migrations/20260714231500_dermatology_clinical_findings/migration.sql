CREATE TABLE "DermatologyCondition" (
  "id" UUID NOT NULL, "stableCode" TEXT NOT NULL, "nameEn" TEXT NOT NULL, "nameAr" TEXT,
  "aliasesJson" JSONB NOT NULL, "likelyCategoriesJson" JSONB NOT NULL, "differentialJson" JSONB NOT NULL,
  "redFlagsJson" JSONB NOT NULL, "nonDrugCareJson" JSONB NOT NULL, "reviewStatus" TEXT NOT NULL DEFAULT 'needs_review',
  "sourceId" UUID, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "DermatologyCondition_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DermatologyGenericOption" (
  "id" UUID NOT NULL, "conditionId" UUID NOT NULL, "medicationGenericId" UUID NOT NULL,
  "bodyAreaSuitabilityJson" JSONB NOT NULL, "pregnancyLactationText" TEXT, "adverseEffectsJson" JSONB NOT NULL,
  "monitoringJson" JSONB NOT NULL, "followUpText" TEXT, "reviewStatus" TEXT NOT NULL DEFAULT 'needs_review',
  "sourceId" UUID NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "DermatologyGenericOption_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PatientClinicalFinding" (
  "id" UUID NOT NULL, "patientId" UUID NOT NULL, "encounterId" UUID NOT NULL, "conditionId" UUID,
  "stableTag" TEXT NOT NULL, "detailsJson" JSONB NOT NULL, "bodyArea" TEXT, "status" TEXT NOT NULL DEFAULT 'active',
  "confirmation" TEXT NOT NULL DEFAULT 'doctor_confirmed', "nextAction" TEXT, "followUpText" TEXT,
  "createdByUserId" UUID NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "PatientClinicalFinding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DermatologyCondition_stableCode_key" ON "DermatologyCondition"("stableCode");
CREATE INDEX "DermatologyCondition_reviewStatus_idx" ON "DermatologyCondition"("reviewStatus");
CREATE INDEX "DermatologyCondition_sourceId_idx" ON "DermatologyCondition"("sourceId");
CREATE UNIQUE INDEX "DermatologyGenericOption_conditionId_medicationGenericId_sourceId_key" ON "DermatologyGenericOption"("conditionId", "medicationGenericId", "sourceId");
CREATE INDEX "DermatologyGenericOption_medicationGenericId_reviewStatus_idx" ON "DermatologyGenericOption"("medicationGenericId", "reviewStatus");
CREATE INDEX "DermatologyGenericOption_sourceId_idx" ON "DermatologyGenericOption"("sourceId");
CREATE INDEX "PatientClinicalFinding_patientId_status_idx" ON "PatientClinicalFinding"("patientId", "status");
CREATE INDEX "PatientClinicalFinding_encounterId_idx" ON "PatientClinicalFinding"("encounterId");
CREATE INDEX "PatientClinicalFinding_stableTag_idx" ON "PatientClinicalFinding"("stableTag");
ALTER TABLE "DermatologyCondition" ADD CONSTRAINT "DermatologyCondition_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PharmacologySource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DermatologyGenericOption" ADD CONSTRAINT "DermatologyGenericOption_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "DermatologyCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DermatologyGenericOption" ADD CONSTRAINT "DermatologyGenericOption_medicationGenericId_fkey" FOREIGN KEY ("medicationGenericId") REFERENCES "MedicationGeneric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DermatologyGenericOption" ADD CONSTRAINT "DermatologyGenericOption_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PharmacologySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalFinding" ADD CONSTRAINT "PatientClinicalFinding_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalFinding" ADD CONSTRAINT "PatientClinicalFinding_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalFinding" ADD CONSTRAINT "PatientClinicalFinding_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "DermatologyCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalFinding" ADD CONSTRAINT "PatientClinicalFinding_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
