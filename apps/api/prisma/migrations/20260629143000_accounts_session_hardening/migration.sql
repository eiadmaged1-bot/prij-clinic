ALTER TABLE "User"
  ADD COLUMN "permissionPreset" TEXT NOT NULL DEFAULT 'advanced',
  ADD COLUMN "protectedAccount" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "createdByUserId" UUID;

ALTER TABLE "User"
  ADD CONSTRAINT "User_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_createdByUserId_idx" ON "User"("createdByUserId");
CREATE INDEX "User_protectedAccount_idx" ON "User"("protectedAccount");

CREATE TABLE "UserPermissionOverride" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "permissionId" UUID NOT NULL,
  "effect" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "grantedByUserId" UUID,

  CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPermissionOverride_userId_permissionId_key" ON "UserPermissionOverride"("userId", "permissionId");
CREATE INDEX "UserPermissionOverride_permissionId_idx" ON "UserPermissionOverride"("permissionId");
CREATE INDEX "UserPermissionOverride_grantedByUserId_idx" ON "UserPermissionOverride"("grantedByUserId");

ALTER TABLE "UserPermissionOverride"
  ADD CONSTRAINT "UserPermissionOverride_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPermissionOverride"
  ADD CONSTRAINT "UserPermissionOverride_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPermissionOverride"
  ADD CONSTRAINT "UserPermissionOverride_grantedByUserId_fkey"
  FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
