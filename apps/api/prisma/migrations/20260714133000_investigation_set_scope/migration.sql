ALTER TABLE "InvestigationFavoriteSet"
  ADD COLUMN "nameAr" TEXT,
  ADD COLUMN "icon" TEXT,
  ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'personal',
  ADD COLUMN "branchId" UUID;

CREATE INDEX "InvestigationFavoriteSet_scope_branchId_active_idx"
  ON "InvestigationFavoriteSet"("scope", "branchId", "active");
