ALTER TABLE "GuidelineDocument"
  ADD COLUMN "fileEncrypted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "fileEncryptionKeyId" TEXT,
  ADD COLUMN "fileEncryptionIv" TEXT,
  ADD COLUMN "fileEncryptionTag" TEXT,
  ADD COLUMN "downloadsAllowed" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "GuidelineDocument_downloadsAllowed_idx" ON "GuidelineDocument"("downloadsAllowed");
