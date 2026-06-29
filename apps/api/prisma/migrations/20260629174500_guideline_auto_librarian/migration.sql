-- CreateEnum
CREATE TYPE "GuidelineSourceType" AS ENUM ('OPEN_PUBLIC', 'PUBLIC_RESTRICTED', 'LICENSED_UPLOAD', 'LOGIN_REQUIRED', 'LINK_ONLY', 'DO_NOT_IMPORT');

-- CreateEnum
CREATE TYPE "GuidelineAccessLevel" AS ENUM ('OWNER_ONLY', 'OWNER_DOCTOR', 'CLINICAL_TEAM');

-- CreateEnum
CREATE TYPE "GuidelineStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'ARCHIVED', 'DRAFT_IMPORT', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "GuidelineLicenseStatus" AS ENUM ('OPEN', 'CHECK_REQUIRED', 'LICENSED_PRIVATE', 'LOGIN_REQUIRED', 'LINK_ONLY', 'DO_NOT_IMPORT');

-- CreateEnum
CREATE TYPE "GuidelineImportJobType" AS ENUM ('OPEN_SOURCE_IMPORT', 'PRIVATE_UPLOAD', 'TEXT_EXTRACTION', 'REINDEX', 'UPDATE_CHECK');

-- CreateEnum
CREATE TYPE "GuidelineImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "GuidelineUpdateCheckStatus" AS ENUM ('NO_CHANGE', 'POSSIBLE_UPDATE', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "GuidelineReviewDecisionValue" AS ENUM ('APPROVED', 'REJECTED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GuidelineAnswerMode" AS ENUM ('SEARCH_ONLY', 'MOCK_RAG', 'CITATION_SUMMARY');

-- CreateTable
CREATE TABLE "GuidelineSource" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "sourceType" "GuidelineSourceType" NOT NULL,
    "websiteUrl" TEXT,
    "countryOrRegion" TEXT,
    "specialties" JSONB,
    "defaultAccessLevel" "GuidelineAccessLevel" NOT NULL DEFAULT 'OWNER_DOCTOR',
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GuidelineSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidelineDocument" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "organization" TEXT NOT NULL,
    "publicationDate" DATE,
    "lastReviewedDate" DATE,
    "versionLabel" TEXT,
    "guidelineStatus" "GuidelineStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "licenseStatus" "GuidelineLicenseStatus" NOT NULL DEFAULT 'CHECK_REQUIRED',
    "originalUrl" TEXT,
    "localFilePath" TEXT,
    "fileName" TEXT,
    "fileMimeType" TEXT,
    "fileSha256" TEXT,
    "importedByUserId" UUID,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "accessLevel" "GuidelineAccessLevel" NOT NULL DEFAULT 'OWNER_DOCTOR',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GuidelineDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidelineVersion" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "publicationDate" DATE,
    "lastReviewedDate" DATE,
    "status" "GuidelineStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "fileSha256" TEXT,
    "extractedTextHash" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GuidelineVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidelineSection" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "versionId" UUID,
    "heading" TEXT NOT NULL,
    "sectionPath" TEXT,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "orderIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GuidelineSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidelineChunk" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "sectionId" UUID,
    "versionId" UUID,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "tokenEstimate" INTEGER,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "citationLabel" TEXT NOT NULL,
    "embeddingJson" JSONB,
    "searchVectorText" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GuidelineChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidelineImportJob" (
    "id" UUID NOT NULL,
    "jobType" "GuidelineImportJobType" NOT NULL,
    "status" "GuidelineImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "sourceId" UUID,
    "documentId" UUID,
    "requestedByUserId" UUID,
    "inputUrl" TEXT,
    "inputFileName" TEXT,
    "message" TEXT,
    "errorMessage" TEXT,
    "resultJson" JSONB,
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GuidelineImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidelineUpdateCheck" (
    "id" UUID NOT NULL,
    "sourceId" UUID,
    "documentId" UUID,
    "status" "GuidelineUpdateCheckStatus" NOT NULL,
    "checkedUrl" TEXT,
    "detectedTitle" TEXT,
    "detectedVersion" TEXT,
    "detectedDate" DATE,
    "message" TEXT,
    "resultJson" JSONB,
    "checkedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuidelineUpdateCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidelineReviewDecision" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "versionId" UUID,
    "decision" "GuidelineReviewDecisionValue" NOT NULL,
    "reason" TEXT,
    "decidedByUserId" UUID NOT NULL,
    "decidedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuidelineReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidelineQueryLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "query" TEXT NOT NULL,
    "specialty" TEXT,
    "topic" TEXT,
    "answerMode" "GuidelineAnswerMode" NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "citedChunkIds" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuidelineQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuidelineSource_organization_idx" ON "GuidelineSource"("organization");
CREATE INDEX "GuidelineSource_sourceType_idx" ON "GuidelineSource"("sourceType");
CREATE INDEX "GuidelineSource_active_idx" ON "GuidelineSource"("active");
CREATE INDEX "GuidelineDocument_sourceId_idx" ON "GuidelineDocument"("sourceId");
CREATE INDEX "GuidelineDocument_specialty_idx" ON "GuidelineDocument"("specialty");
CREATE INDEX "GuidelineDocument_topic_idx" ON "GuidelineDocument"("topic");
CREATE INDEX "GuidelineDocument_guidelineStatus_idx" ON "GuidelineDocument"("guidelineStatus");
CREATE INDEX "GuidelineDocument_licenseStatus_idx" ON "GuidelineDocument"("licenseStatus");
CREATE INDEX "GuidelineDocument_fileSha256_idx" ON "GuidelineDocument"("fileSha256");
CREATE INDEX "GuidelineDocument_accessLevel_idx" ON "GuidelineDocument"("accessLevel");
CREATE INDEX "GuidelineVersion_documentId_idx" ON "GuidelineVersion"("documentId");
CREATE INDEX "GuidelineVersion_status_idx" ON "GuidelineVersion"("status");
CREATE INDEX "GuidelineVersion_fileSha256_idx" ON "GuidelineVersion"("fileSha256");
CREATE INDEX "GuidelineSection_documentId_orderIndex_idx" ON "GuidelineSection"("documentId", "orderIndex");
CREATE INDEX "GuidelineSection_versionId_idx" ON "GuidelineSection"("versionId");
CREATE UNIQUE INDEX "GuidelineChunk_documentId_chunkIndex_key" ON "GuidelineChunk"("documentId", "chunkIndex");
CREATE INDEX "GuidelineChunk_documentId_idx" ON "GuidelineChunk"("documentId");
CREATE INDEX "GuidelineChunk_sectionId_idx" ON "GuidelineChunk"("sectionId");
CREATE INDEX "GuidelineChunk_versionId_idx" ON "GuidelineChunk"("versionId");
CREATE INDEX "GuidelineImportJob_jobType_idx" ON "GuidelineImportJob"("jobType");
CREATE INDEX "GuidelineImportJob_status_idx" ON "GuidelineImportJob"("status");
CREATE INDEX "GuidelineImportJob_sourceId_idx" ON "GuidelineImportJob"("sourceId");
CREATE INDEX "GuidelineImportJob_documentId_idx" ON "GuidelineImportJob"("documentId");
CREATE INDEX "GuidelineUpdateCheck_sourceId_idx" ON "GuidelineUpdateCheck"("sourceId");
CREATE INDEX "GuidelineUpdateCheck_documentId_idx" ON "GuidelineUpdateCheck"("documentId");
CREATE INDEX "GuidelineUpdateCheck_status_idx" ON "GuidelineUpdateCheck"("status");
CREATE INDEX "GuidelineUpdateCheck_checkedAt_idx" ON "GuidelineUpdateCheck"("checkedAt");
CREATE INDEX "GuidelineReviewDecision_documentId_idx" ON "GuidelineReviewDecision"("documentId");
CREATE INDEX "GuidelineReviewDecision_versionId_idx" ON "GuidelineReviewDecision"("versionId");
CREATE INDEX "GuidelineReviewDecision_decision_idx" ON "GuidelineReviewDecision"("decision");
CREATE INDEX "GuidelineReviewDecision_decidedByUserId_idx" ON "GuidelineReviewDecision"("decidedByUserId");
CREATE INDEX "GuidelineQueryLog_userId_createdAt_idx" ON "GuidelineQueryLog"("userId", "createdAt");
CREATE INDEX "GuidelineQueryLog_specialty_idx" ON "GuidelineQueryLog"("specialty");
CREATE INDEX "GuidelineQueryLog_topic_idx" ON "GuidelineQueryLog"("topic");
CREATE INDEX "GuidelineQueryLog_answerMode_idx" ON "GuidelineQueryLog"("answerMode");

-- AddForeignKey
ALTER TABLE "GuidelineDocument" ADD CONSTRAINT "GuidelineDocument_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "GuidelineSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuidelineDocument" ADD CONSTRAINT "GuidelineDocument_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineDocument" ADD CONSTRAINT "GuidelineDocument_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineVersion" ADD CONSTRAINT "GuidelineVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineSection" ADD CONSTRAINT "GuidelineSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineSection" ADD CONSTRAINT "GuidelineSection_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "GuidelineVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineChunk" ADD CONSTRAINT "GuidelineChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineChunk" ADD CONSTRAINT "GuidelineChunk_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GuidelineSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineChunk" ADD CONSTRAINT "GuidelineChunk_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "GuidelineVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineImportJob" ADD CONSTRAINT "GuidelineImportJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "GuidelineSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineImportJob" ADD CONSTRAINT "GuidelineImportJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineImportJob" ADD CONSTRAINT "GuidelineImportJob_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineUpdateCheck" ADD CONSTRAINT "GuidelineUpdateCheck_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "GuidelineSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineUpdateCheck" ADD CONSTRAINT "GuidelineUpdateCheck_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineReviewDecision" ADD CONSTRAINT "GuidelineReviewDecision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineReviewDecision" ADD CONSTRAINT "GuidelineReviewDecision_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "GuidelineVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineReviewDecision" ADD CONSTRAINT "GuidelineReviewDecision_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuidelineQueryLog" ADD CONSTRAINT "GuidelineQueryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
