CREATE TABLE "GuidelineSummary" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "documentId" UUID NOT NULL, "versionId" UUID,
  "status" TEXT NOT NULL DEFAULT 'DRAFT_SUMMARY', "provenanceType" TEXT NOT NULL DEFAULT 'AI_GENERATED_DRAFT',
  "createdByUserId" UUID, "reviewedByUserId" UUID, "reviewReason" TEXT, "reviewedAt" TIMESTAMPTZ(3), "publishedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "GuidelineSummary_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GuidelineSummarySection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "summaryId" UUID NOT NULL, "sectionType" TEXT NOT NULL, "heading" TEXT NOT NULL,
  "bulletsJson" JSONB NOT NULL, "orderIndex" INTEGER NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "GuidelineSummarySection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GuidelineSummaryCitation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "summarySectionId" UUID NOT NULL, "documentId" UUID NOT NULL, "sectionId" UUID, "chunkId" UUID,
  "bulletIndex" INTEGER NOT NULL, "pageStart" INTEGER NOT NULL, "pageEnd" INTEGER, "citationType" TEXT NOT NULL, "label" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "GuidelineSummaryCitation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuidelineSummary_documentId_status_idx" ON "GuidelineSummary"("documentId", "status");
CREATE INDEX "GuidelineSummary_versionId_idx" ON "GuidelineSummary"("versionId");
CREATE INDEX "GuidelineSummary_reviewedByUserId_idx" ON "GuidelineSummary"("reviewedByUserId");
CREATE UNIQUE INDEX "GuidelineSummarySection_summaryId_sectionType_key" ON "GuidelineSummarySection"("summaryId", "sectionType");
CREATE INDEX "GuidelineSummarySection_summaryId_orderIndex_idx" ON "GuidelineSummarySection"("summaryId", "orderIndex");
CREATE INDEX "GuidelineSummaryCitation_summarySectionId_bulletIndex_idx" ON "GuidelineSummaryCitation"("summarySectionId", "bulletIndex");
CREATE INDEX "GuidelineSummaryCitation_documentId_pageStart_idx" ON "GuidelineSummaryCitation"("documentId", "pageStart");
CREATE INDEX "GuidelineSummaryCitation_sectionId_idx" ON "GuidelineSummaryCitation"("sectionId");
CREATE INDEX "GuidelineSummaryCitation_chunkId_idx" ON "GuidelineSummaryCitation"("chunkId");
ALTER TABLE "GuidelineSummary" ADD CONSTRAINT "GuidelineSummary_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineSummary" ADD CONSTRAINT "GuidelineSummary_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "GuidelineVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineSummary" ADD CONSTRAINT "GuidelineSummary_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineSummary" ADD CONSTRAINT "GuidelineSummary_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineSummarySection" ADD CONSTRAINT "GuidelineSummarySection_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "GuidelineSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineSummaryCitation" ADD CONSTRAINT "GuidelineSummaryCitation_summarySectionId_fkey" FOREIGN KEY ("summarySectionId") REFERENCES "GuidelineSummarySection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineSummaryCitation" ADD CONSTRAINT "GuidelineSummaryCitation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuidelineSummaryCitation" ADD CONSTRAINT "GuidelineSummaryCitation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GuidelineSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuidelineSummaryCitation" ADD CONSTRAINT "GuidelineSummaryCitation_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "GuidelineChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
