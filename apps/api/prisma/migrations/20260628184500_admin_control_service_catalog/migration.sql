-- AlterTable
ALTER TABLE "User" ADD COLUMN "loginId" TEXT;

-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceItem_code_key" ON "ServiceItem"("code");

-- CreateIndex
CREATE INDEX "ServiceItem_category_idx" ON "ServiceItem"("category");

-- CreateIndex
CREATE INDEX "ServiceItem_active_idx" ON "ServiceItem"("active");
