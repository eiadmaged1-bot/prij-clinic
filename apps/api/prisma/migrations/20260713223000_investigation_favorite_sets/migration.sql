-- Doctor-owned reusable investigation sets and optional requested follow-up date.

ALTER TABLE "InvestigationOrder" ADD COLUMN IF NOT EXISTS "requestedFollowUpDate" DATE;

CREATE TABLE IF NOT EXISTS "InvestigationFavoriteSet" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "defaultVisitType" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestigationFavoriteSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InvestigationFavoriteSetItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "favoriteSetId" UUID NOT NULL,
  "investigationCatalogItemId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "InvestigationFavoriteSetItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InvestigationOrder_requestedFollowUpDate_idx" ON "InvestigationOrder"("requestedFollowUpDate");
CREATE INDEX IF NOT EXISTS "InvestigationFavoriteSet_userId_active_idx" ON "InvestigationFavoriteSet"("userId", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "InvestigationFavoriteSetItem_favoriteSetId_investigationCatalogItemId_key" ON "InvestigationFavoriteSetItem"("favoriteSetId", "investigationCatalogItemId");
CREATE INDEX IF NOT EXISTS "InvestigationFavoriteSetItem_favoriteSetId_position_idx" ON "InvestigationFavoriteSetItem"("favoriteSetId", "position");

ALTER TABLE "InvestigationFavoriteSet" ADD CONSTRAINT "InvestigationFavoriteSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationFavoriteSetItem" ADD CONSTRAINT "InvestigationFavoriteSetItem_favoriteSetId_fkey" FOREIGN KEY ("favoriteSetId") REFERENCES "InvestigationFavoriteSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationFavoriteSetItem" ADD CONSTRAINT "InvestigationFavoriteSetItem_investigationCatalogItemId_fkey" FOREIGN KEY ("investigationCatalogItemId") REFERENCES "InvestigationCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
