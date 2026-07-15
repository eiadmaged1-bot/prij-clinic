ALTER TABLE "GuidelineDocument"
ADD COLUMN IF NOT EXISTS "pageCount" INTEGER;

ALTER TABLE "GuidelineDocument"
ADD CONSTRAINT "GuidelineDocument_pageCount_positive"
CHECK ("pageCount" IS NULL OR "pageCount" > 0) NOT VALID;
