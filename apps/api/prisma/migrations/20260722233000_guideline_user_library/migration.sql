CREATE TABLE IF NOT EXISTS "GuidelineFavorite" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "documentId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuidelineFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GuidelineFavorite_userId_documentId_key"
  ON "GuidelineFavorite"("userId", "documentId");

CREATE INDEX IF NOT EXISTS "GuidelineFavorite_userId_createdAt_idx"
  ON "GuidelineFavorite"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "GuidelineFavorite_documentId_idx"
  ON "GuidelineFavorite"("documentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GuidelineFavorite_userId_fkey'
  ) THEN
    ALTER TABLE "GuidelineFavorite"
      ADD CONSTRAINT "GuidelineFavorite_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GuidelineFavorite_documentId_fkey'
  ) THEN
    ALTER TABLE "GuidelineFavorite"
      ADD CONSTRAINT "GuidelineFavorite_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
