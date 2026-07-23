ALTER TABLE "GuidelineDocument"
  ADD COLUMN "guidelineCode" TEXT,
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "tags" JSONB;

UPDATE "GuidelineDocument"
SET "guidelineCode" = "versionLabel"
WHERE "guidelineCode" IS NULL AND "versionLabel" IS NOT NULL
  AND "documentType" = 'official_pdf' AND "fileSha256" IS NOT NULL AND "localFilePath" IS NOT NULL;

UPDATE "GuidelineDocument"
SET "tags" = jsonb_build_array("specialty", "topic")
WHERE "tags" IS NULL
  AND "documentType" = 'official_pdf' AND "fileSha256" IS NOT NULL AND "localFilePath" IS NOT NULL;

CREATE INDEX "GuidelineDocument_guidelineCode_idx" ON "GuidelineDocument"("guidelineCode");
CREATE INDEX "GuidelineDocument_language_idx" ON "GuidelineDocument"("language");

CREATE TABLE "GuidelineFavorite" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "userId" UUID NOT NULL, "documentId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuidelineFavorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuidelineFavorite_userId_documentId_key" ON "GuidelineFavorite"("userId", "documentId");
CREATE INDEX "GuidelineFavorite_userId_createdAt_idx" ON "GuidelineFavorite"("userId", "createdAt");
ALTER TABLE "GuidelineFavorite" ADD CONSTRAINT "GuidelineFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineFavorite" ADD CONSTRAINT "GuidelineFavorite_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GuidelineRecentOpen" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "userId" UUID NOT NULL, "documentId" UUID NOT NULL,
  "lastPage" INTEGER NOT NULL DEFAULT 1, "openCount" INTEGER NOT NULL DEFAULT 1,
  "lastOpenedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuidelineRecentOpen_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuidelineRecentOpen_userId_documentId_key" ON "GuidelineRecentOpen"("userId", "documentId");
CREATE INDEX "GuidelineRecentOpen_userId_lastOpenedAt_idx" ON "GuidelineRecentOpen"("userId", "lastOpenedAt");
ALTER TABLE "GuidelineRecentOpen" ADD CONSTRAINT "GuidelineRecentOpen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineRecentOpen" ADD CONSTRAINT "GuidelineRecentOpen_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
