-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMPTZ(3),
ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'low',
ADD COLUMN "reason" TEXT,
ADD COLUMN "requestId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_severity_createdAt_idx" ON "AuditLog"("severity", "createdAt");
