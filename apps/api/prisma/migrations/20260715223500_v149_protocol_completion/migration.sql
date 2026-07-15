ALTER TABLE "ClinicalProtocol"
ADD COLUMN "completionQuestionnaireJson" JSONB,
ADD COLUMN "connectionsJson" JSONB,
ADD COLUMN "completionPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "completionReviewerUserId" UUID,
ADD COLUMN "completionApprovedAt" TIMESTAMPTZ(3),
ADD COLUMN "completionVersion" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX "ClinicalProtocol_completionPercentage_idx" ON "ClinicalProtocol"("completionPercentage");
