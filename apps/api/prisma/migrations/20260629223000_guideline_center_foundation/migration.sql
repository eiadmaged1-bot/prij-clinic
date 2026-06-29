DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuidelineSourceType') THEN
    CREATE TYPE "GuidelineSourceType" AS ENUM ('OPEN_PUBLIC', 'PUBLIC_RESTRICTED', 'LICENSED_UPLOAD', 'LOGIN_REQUIRED', 'LINK_ONLY', 'DO_NOT_IMPORT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuidelineAccessLevel') THEN
    CREATE TYPE "GuidelineAccessLevel" AS ENUM ('OWNER_ONLY', 'OWNER_DOCTOR', 'CLINICAL_TEAM');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuidelineStatus') THEN
    CREATE TYPE "GuidelineStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'ARCHIVED', 'DRAFT_IMPORT', 'NEEDS_REVIEW');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuidelineLicenseStatus') THEN
    CREATE TYPE "GuidelineLicenseStatus" AS ENUM ('OPEN', 'CHECK_REQUIRED', 'LICENSED_PRIVATE', 'LOGIN_REQUIRED', 'LINK_ONLY', 'DO_NOT_IMPORT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuidelineImportJobStatus') THEN
    CREATE TYPE "GuidelineImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'NEEDS_REVIEW');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuidelineImportJobType') THEN
    CREATE TYPE "GuidelineImportJobType" AS ENUM ('OPEN_SOURCE_IMPORT', 'PRIVATE_UPLOAD', 'TEXT_EXTRACTION', 'REINDEX', 'UPDATE_CHECK');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuidelineReviewDecisionValue') THEN
    CREATE TYPE "GuidelineReviewDecisionValue" AS ENUM ('APPROVED', 'REJECTED', 'SUPERSEDED', 'ARCHIVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuidelineAnswerMode') THEN
    CREATE TYPE "GuidelineAnswerMode" AS ENUM ('SEARCH_ONLY', 'MOCK_RAG', 'CITATION_SUMMARY');
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS "GuidelineSource" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "organization" TEXT NOT NULL DEFAULT 'Local source registry',
  "sourceType" "GuidelineSourceType" NOT NULL DEFAULT 'LINK_ONLY',
  "abbreviation" TEXT,
  "websiteUrl" TEXT,
  "countryOrRegion" TEXT,
  "specialties" JSONB,
  "defaultAccessLevel" "GuidelineAccessLevel" NOT NULL DEFAULT 'OWNER_DOCTOR',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'active',
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "GuidelineSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuidelineDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sourceId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "specialty" TEXT NOT NULL DEFAULT 'Women''s health',
  "topic" TEXT NOT NULL DEFAULT 'Guideline center',
  "subtopic" TEXT,
  "organization" TEXT NOT NULL DEFAULT 'Local Clinic Protocol',
  "guidelineStatus" "GuidelineStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
  "documentType" TEXT NOT NULL DEFAULT 'demo_text',
  "licenseStatus" "GuidelineLicenseStatus" NOT NULL DEFAULT 'CHECK_REQUIRED',
  "originalUrl" TEXT,
  "accessLevel" "GuidelineAccessLevel" NOT NULL DEFAULT 'OWNER_DOCTOR',
  "reviewStatus" TEXT NOT NULL DEFAULT 'pending_governance_review',
  "citationLabel" TEXT NOT NULL,
  "storageRef" TEXT,
  "importedByUserId" UUID,
  "reviewedByUserId" UUID,
  "reviewedAt" TIMESTAMPTZ(3),
  "fileEncrypted" BOOLEAN NOT NULL DEFAULT false,
  "downloadsAllowed" BOOLEAN NOT NULL DEFAULT false,
  "archivedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "GuidelineDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuidelineVersion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "publishedYear" INTEGER,
  "sourceUrl" TEXT,
  "status" "GuidelineStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuidelineVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuidelineSection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "versionId" UUID,
  "heading" TEXT NOT NULL,
  "sectionPath" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "text" TEXT NOT NULL DEFAULT '',
  "reviewStatus" TEXT NOT NULL DEFAULT 'pending_governance_review',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuidelineSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuidelineChunk" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "sectionId" UUID NOT NULL,
  "versionId" UUID,
  "chunkIndex" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "normalizedText" TEXT NOT NULL DEFAULT '',
  "tokenEstimate" INTEGER,
  "citationLabel" TEXT NOT NULL,
  "reviewStatus" TEXT NOT NULL DEFAULT 'pending_governance_review',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuidelineChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuidelineImportJob" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "jobType" "GuidelineImportJobType" NOT NULL DEFAULT 'TEXT_EXTRACTION',
  "documentId" UUID,
  "sourceId" UUID,
  "status" "GuidelineImportJobStatus" NOT NULL DEFAULT 'SUCCEEDED',
  "importType" TEXT NOT NULL DEFAULT 'demo_text',
  "summary" TEXT,
  "requestedByUserId" UUID,
  "message" TEXT,
  "resultJson" JSONB,
  "startedAt" TIMESTAMPTZ(3),
  "finishedAt" TIMESTAMPTZ(3),
  "createdByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuidelineImportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuidelineReviewDecision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "decision" "GuidelineReviewDecisionValue" NOT NULL,
  "reason" TEXT,
  "decidedByUserId" UUID,
  "decidedAt" TIMESTAMPTZ(3),
  "reviewerUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuidelineReviewDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuidelineQueryLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID,
  "queryText" TEXT NOT NULL,
  "query" TEXT,
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "mode" TEXT NOT NULL DEFAULT 'search',
  "answerMode" "GuidelineAnswerMode",
  "citedChunkIds" JSONB,
  "actorUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuidelineQueryLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GuidelineSource" ADD COLUMN IF NOT EXISTS "abbreviation" TEXT;
ALTER TABLE "GuidelineSource" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "GuidelineSource" ADD COLUMN IF NOT EXISTS "organization" TEXT NOT NULL DEFAULT 'Local source registry';
ALTER TABLE "GuidelineSource" ADD COLUMN IF NOT EXISTS "sourceType" "GuidelineSourceType" NOT NULL DEFAULT 'LINK_ONLY';
ALTER TABLE "GuidelineSource" ADD COLUMN IF NOT EXISTS "countryOrRegion" TEXT;
ALTER TABLE "GuidelineSource" ADD COLUMN IF NOT EXISTS "specialties" JSONB;
ALTER TABLE "GuidelineSource" ADD COLUMN IF NOT EXISTS "defaultAccessLevel" "GuidelineAccessLevel" NOT NULL DEFAULT 'OWNER_DOCTOR';
ALTER TABLE "GuidelineSource" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "documentType" TEXT NOT NULL DEFAULT 'demo_text';
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'pending_governance_review';
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "citationLabel" TEXT NOT NULL DEFAULT 'Local evidence library citation';
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "storageRef" TEXT;
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMPTZ(3);
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "specialty" TEXT NOT NULL DEFAULT 'Women''s health';
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "topic" TEXT NOT NULL DEFAULT 'Guideline center';
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "subtopic" TEXT;
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "organization" TEXT NOT NULL DEFAULT 'Local Clinic Protocol';
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "guidelineStatus" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW';
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "originalUrl" TEXT;
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "importedByUserId" UUID;
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "reviewedByUserId" UUID;
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMPTZ(3);
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "fileEncrypted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GuidelineDocument" ADD COLUMN IF NOT EXISTS "downloadsAllowed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "GuidelineVersion" ADD COLUMN IF NOT EXISTS "publishedYear" INTEGER;
ALTER TABLE "GuidelineVersion" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "GuidelineVersion" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "GuidelineSection" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GuidelineSection" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'pending_governance_review';
ALTER TABLE "GuidelineSection" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "GuidelineSection" ADD COLUMN IF NOT EXISTS "sectionPath" TEXT;
ALTER TABLE "GuidelineSection" ADD COLUMN IF NOT EXISTS "orderIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GuidelineSection" ADD COLUMN IF NOT EXISTS "text" TEXT NOT NULL DEFAULT '';

ALTER TABLE "GuidelineChunk" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'pending_governance_review';
ALTER TABLE "GuidelineChunk" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "GuidelineChunk" ADD COLUMN IF NOT EXISTS "documentId" UUID;
ALTER TABLE "GuidelineChunk" ADD COLUMN IF NOT EXISTS "versionId" UUID;
ALTER TABLE "GuidelineChunk" ADD COLUMN IF NOT EXISTS "normalizedText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "GuidelineChunk" ADD COLUMN IF NOT EXISTS "tokenEstimate" INTEGER;

ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "importType" TEXT NOT NULL DEFAULT 'demo_text';
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "summary" TEXT;
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "createdByUserId" UUID;
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "jobType" TEXT NOT NULL DEFAULT 'TEXT_EXTRACTION';
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "sourceId" UUID;
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "requestedByUserId" UUID;
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "resultJson" JSONB;
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMPTZ(3);
ALTER TABLE "GuidelineImportJob" ADD COLUMN IF NOT EXISTS "finishedAt" TIMESTAMPTZ(3);

ALTER TABLE "GuidelineReviewDecision" ADD COLUMN IF NOT EXISTS "reviewerUserId" UUID;
ALTER TABLE "GuidelineReviewDecision" ADD COLUMN IF NOT EXISTS "decidedByUserId" UUID;
ALTER TABLE "GuidelineReviewDecision" ADD COLUMN IF NOT EXISTS "decidedAt" TIMESTAMPTZ(3);

ALTER TABLE "GuidelineQueryLog" ADD COLUMN IF NOT EXISTS "queryText" TEXT NOT NULL DEFAULT '(empty)';
ALTER TABLE "GuidelineQueryLog" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'search';
ALTER TABLE "GuidelineQueryLog" ADD COLUMN IF NOT EXISTS "actorUserId" UUID;
ALTER TABLE "GuidelineQueryLog" ADD COLUMN IF NOT EXISTS "userId" UUID;
ALTER TABLE "GuidelineQueryLog" ADD COLUMN IF NOT EXISTS "query" TEXT;
ALTER TABLE "GuidelineQueryLog" ADD COLUMN IF NOT EXISTS "answerMode" "GuidelineAnswerMode";
ALTER TABLE "GuidelineQueryLog" ADD COLUMN IF NOT EXISTS "citedChunkIds" JSONB;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'GuidelineQueryLog'
      AND column_name = 'answerMode'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "GuidelineQueryLog"
      ALTER COLUMN "answerMode" TYPE "GuidelineAnswerMode"
      USING NULLIF("answerMode", '')::"GuidelineAnswerMode";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "GuidelineSource_name_key" ON "GuidelineSource"("name");
CREATE INDEX IF NOT EXISTS "GuidelineSource_status_idx" ON "GuidelineSource"("status");
CREATE INDEX IF NOT EXISTS "GuidelineDocument_sourceId_idx" ON "GuidelineDocument"("sourceId");
CREATE INDEX IF NOT EXISTS "GuidelineDocument_reviewStatus_idx" ON "GuidelineDocument"("reviewStatus");
CREATE INDEX IF NOT EXISTS "GuidelineDocument_archivedAt_idx" ON "GuidelineDocument"("archivedAt");
CREATE INDEX IF NOT EXISTS "GuidelineVersion_documentId_idx" ON "GuidelineVersion"("documentId");
CREATE INDEX IF NOT EXISTS "GuidelineVersion_status_idx" ON "GuidelineVersion"("status");
CREATE INDEX IF NOT EXISTS "GuidelineSection_documentId_idx" ON "GuidelineSection"("documentId");
CREATE INDEX IF NOT EXISTS "GuidelineSection_versionId_idx" ON "GuidelineSection"("versionId");
CREATE UNIQUE INDEX IF NOT EXISTS "GuidelineChunk_sectionId_chunkIndex_key" ON "GuidelineChunk"("sectionId", "chunkIndex");
CREATE INDEX IF NOT EXISTS "GuidelineChunk_citationLabel_idx" ON "GuidelineChunk"("citationLabel");
CREATE INDEX IF NOT EXISTS "GuidelineChunk_reviewStatus_idx" ON "GuidelineChunk"("reviewStatus");
CREATE INDEX IF NOT EXISTS "GuidelineImportJob_documentId_idx" ON "GuidelineImportJob"("documentId");
CREATE INDEX IF NOT EXISTS "GuidelineImportJob_status_idx" ON "GuidelineImportJob"("status");
CREATE INDEX IF NOT EXISTS "GuidelineReviewDecision_documentId_idx" ON "GuidelineReviewDecision"("documentId");
CREATE INDEX IF NOT EXISTS "GuidelineReviewDecision_decision_idx" ON "GuidelineReviewDecision"("decision");
CREATE INDEX IF NOT EXISTS "GuidelineQueryLog_actorUserId_createdAt_idx" ON "GuidelineQueryLog"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "GuidelineQueryLog_mode_idx" ON "GuidelineQueryLog"("mode");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GuidelineDocument_sourceId_fkey') THEN
    ALTER TABLE "GuidelineDocument" ADD CONSTRAINT "GuidelineDocument_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "GuidelineSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GuidelineVersion_documentId_fkey') THEN
    ALTER TABLE "GuidelineVersion" ADD CONSTRAINT "GuidelineVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GuidelineSection_documentId_fkey') THEN
    ALTER TABLE "GuidelineSection" ADD CONSTRAINT "GuidelineSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GuidelineSection_versionId_fkey') THEN
    ALTER TABLE "GuidelineSection" ADD CONSTRAINT "GuidelineSection_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "GuidelineVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GuidelineChunk_sectionId_fkey') THEN
    ALTER TABLE "GuidelineChunk" ADD CONSTRAINT "GuidelineChunk_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GuidelineSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GuidelineImportJob_documentId_fkey') THEN
    ALTER TABLE "GuidelineImportJob" ADD CONSTRAINT "GuidelineImportJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GuidelineReviewDecision_documentId_fkey') THEN
    ALTER TABLE "GuidelineReviewDecision" ADD CONSTRAINT "GuidelineReviewDecision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
