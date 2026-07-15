ALTER TABLE "ObUltrasound"
ADD COLUMN "clinicalContext" TEXT NOT NULL DEFAULT 'OB',
ADD COLUMN "cycleDay" INTEGER,
ADD COLUMN "structuredFindingsJson" JSONB,
ADD COLUMN "comparisonText" TEXT,
ADD COLUMN "signedAt" TIMESTAMPTZ(3),
ADD COLUMN "signedByUserId" UUID,
ADD COLUMN "amendmentReason" TEXT,
ADD COLUMN "amendmentVersion" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "ObUltrasound_clinicalContext_performedAt_idx" ON "ObUltrasound"("clinicalContext", "performedAt");
