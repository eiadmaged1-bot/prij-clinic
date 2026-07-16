ALTER TABLE "ClinicalProtocol"
  ADD COLUMN "publicationState" TEXT NOT NULL DEFAULT 'LOCAL_DRAFT',
  ADD COLUMN "sourceIdentifier" TEXT,
  ADD COLUMN "sourceRetrievedAt" TIMESTAMPTZ(3),
  ADD COLUMN "sourceCitationsJson" JSONB,
  ADD COLUMN "patientTypesJson" JSONB,
  ADD COLUMN "locallyCustomized" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ClinicalProtocolVersion" (
  "id" TEXT NOT NULL,
  "protocolId" TEXT NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "publicationState" TEXT NOT NULL,
  "sourceIdentifier" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceRetrievedAt" TIMESTAMPTZ(3) NOT NULL,
  "contentJson" JSONB NOT NULL,
  "sourceCitationsJson" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicalProtocolVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClinicalProtocolVersion_protocolId_versionLabel_sourceIdentifier_key" ON "ClinicalProtocolVersion"("protocolId", "versionLabel", "sourceIdentifier");
CREATE INDEX "ClinicalProtocolVersion_protocolId_createdAt_idx" ON "ClinicalProtocolVersion"("protocolId", "createdAt");
CREATE INDEX "ClinicalProtocolVersion_publicationState_idx" ON "ClinicalProtocolVersion"("publicationState");
CREATE INDEX "ClinicalProtocol_publicationState_idx" ON "ClinicalProtocol"("publicationState");
CREATE INDEX "ClinicalProtocol_sourceIdentifier_idx" ON "ClinicalProtocol"("sourceIdentifier");
ALTER TABLE "ClinicalProtocolVersion" ADD CONSTRAINT "ClinicalProtocolVersion_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "ClinicalProtocol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
