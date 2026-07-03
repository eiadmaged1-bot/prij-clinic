-- v0.12.1 clean local database + reference foundation.
-- Adds a reference-only operation/procedure catalog and allows service names
-- to exist without fake prices while finance review is pending.

CREATE TABLE "OperationCatalogItem" (
    "id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "bodySystem" TEXT,
    "isObGyn" BOOLEAN NOT NULL DEFAULT false,
    "isSurgical" BOOLEAN NOT NULL DEFAULT true,
    "aliases" JSONB,
    "sourceType" TEXT NOT NULL DEFAULT 'curated_reference',
    "reviewStatus" TEXT NOT NULL DEFAULT 'reviewed',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OperationCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationCatalogItem_code_key" ON "OperationCatalogItem"("code");
CREATE UNIQUE INDEX "OperationCatalogItem_normalizedName_key" ON "OperationCatalogItem"("normalizedName");
CREATE INDEX "OperationCatalogItem_category_idx" ON "OperationCatalogItem"("category");
CREATE INDEX "OperationCatalogItem_specialty_idx" ON "OperationCatalogItem"("specialty");
CREATE INDEX "OperationCatalogItem_bodySystem_idx" ON "OperationCatalogItem"("bodySystem");
CREATE INDEX "OperationCatalogItem_isObGyn_idx" ON "OperationCatalogItem"("isObGyn");
CREATE INDEX "OperationCatalogItem_isSurgical_idx" ON "OperationCatalogItem"("isSurgical");
CREATE INDEX "OperationCatalogItem_isActive_idx" ON "OperationCatalogItem"("isActive");
CREATE INDEX "OperationCatalogItem_reviewStatus_idx" ON "OperationCatalogItem"("reviewStatus");

ALTER TABLE "ServiceItem" ALTER COLUMN "price" DROP NOT NULL;
ALTER TABLE "ServiceItem" ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT 'local_admin';
ALTER TABLE "ServiceItem" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'reviewed';
CREATE INDEX IF NOT EXISTS "ServiceItem_reviewStatus_idx" ON "ServiceItem"("reviewStatus");
