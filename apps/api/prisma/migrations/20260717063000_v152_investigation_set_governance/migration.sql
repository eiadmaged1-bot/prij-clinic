ALTER TABLE "InvestigationFavoriteSet"
  ADD COLUMN "publicationState" TEXT NOT NULL DEFAULT 'LOCAL_DRAFT',
  ADD COLUMN "sourceIdentifier" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "sourceVersion" TEXT,
  ADD COLUMN "sourceSection" TEXT,
  ADD COLUMN "sourceRetrievedAt" TIMESTAMPTZ(3),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "patientTypesJson" JSONB,
  ADD COLUMN "guidanceText" TEXT,
  ADD COLUMN "actionable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "InvestigationFavoriteSetItem"
  ADD COLUMN "required" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "rationale" TEXT,
  ADD COLUMN "responsibilityJson" JSONB;
CREATE INDEX "InvestigationFavoriteSet_publicationState_active_idx" ON "InvestigationFavoriteSet"("publicationState", "active");
CREATE INDEX "InvestigationFavoriteSet_sourceIdentifier_idx" ON "InvestigationFavoriteSet"("sourceIdentifier");
