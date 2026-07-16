ALTER TABLE "PharmacologySource"
  ADD COLUMN "sourceIdentifier" TEXT,
  ADD COLUMN "effectiveDate" DATE,
  ADD COLUMN "retrievedAt" TIMESTAMPTZ(3),
  ADD COLUMN "checksum" TEXT,
  ADD COLUMN "sourceSection" TEXT,
  ADD COLUMN "publicationState" TEXT NOT NULL DEFAULT 'SOURCE_INCOMPLETE';

ALTER TABLE "DrugFamily"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "bodySystem" TEXT,
  ADD COLUMN "therapeuticGroup" TEXT,
  ADD COLUMN "supersededReason" TEXT;

CREATE INDEX "PharmacologySource_sourceIdentifier_idx" ON "PharmacologySource"("sourceIdentifier");
CREATE INDEX "PharmacologySource_publicationState_idx" ON "PharmacologySource"("publicationState");
CREATE INDEX "DrugFamily_active_bodySystem_idx" ON "DrugFamily"("active", "bodySystem");

CREATE TABLE "MedicationOfficialProfile" (
  "id" UUID NOT NULL,
  "medicationGenericId" UUID NOT NULL,
  "sourceId" UUID NOT NULL,
  "publicationState" TEXT NOT NULL DEFAULT 'SOURCE_INCOMPLETE',
  "sectionCoverageJson" JSONB NOT NULL,
  "indicationsJson" JSONB NOT NULL,
  "mechanismJson" JSONB NOT NULL,
  "contraindicationsJson" JSONB NOT NULL,
  "warningsJson" JSONB NOT NULL,
  "adverseEffectsJson" JSONB NOT NULL,
  "interactionsJson" JSONB NOT NULL,
  "pregnancyJson" JSONB NOT NULL,
  "lactationJson" JSONB NOT NULL,
  "renalJson" JSONB NOT NULL,
  "hepaticJson" JSONB NOT NULL,
  "monitoringJson" JSONB NOT NULL,
  "routesJson" JSONB NOT NULL,
  "dosageFormsJson" JSONB NOT NULL,
  "sourceSectionMapJson" JSONB NOT NULL,
  "conflictJson" JSONB,
  "boxedWarning" BOOLEAN NOT NULL DEFAULT false,
  "effectiveDate" DATE,
  "retrievedAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "MedicationOfficialProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MedicationOfficialProfile_medicationGenericId_key" ON "MedicationOfficialProfile"("medicationGenericId");
CREATE INDEX "MedicationOfficialProfile_publicationState_idx" ON "MedicationOfficialProfile"("publicationState");
CREATE INDEX "MedicationOfficialProfile_sourceId_idx" ON "MedicationOfficialProfile"("sourceId");
ALTER TABLE "MedicationOfficialProfile" ADD CONSTRAINT "MedicationOfficialProfile_medicationGenericId_fkey" FOREIGN KEY ("medicationGenericId") REFERENCES "MedicationGeneric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicationOfficialProfile" ADD CONSTRAINT "MedicationOfficialProfile_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PharmacologySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
