CREATE TABLE "InvestigationCatalogItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "modality" TEXT,
    "sampleType" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "InvestigationCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvestigationCatalogItem_code_key" ON "InvestigationCatalogItem"("code");
CREATE INDEX "InvestigationCatalogItem_category_idx" ON "InvestigationCatalogItem"("category");
CREATE INDEX "InvestigationCatalogItem_discipline_idx" ON "InvestigationCatalogItem"("discipline");
CREATE INDEX "InvestigationCatalogItem_active_idx" ON "InvestigationCatalogItem"("active");
CREATE INDEX "InvestigationCatalogItem_sortOrder_idx" ON "InvestigationCatalogItem"("sortOrder");
