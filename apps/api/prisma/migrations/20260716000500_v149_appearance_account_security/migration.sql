ALTER TABLE "User"
ADD COLUMN "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "twoFactorResetPendingAt" TIMESTAMPTZ(3);

ALTER TABLE "UserPreference"
ADD COLUMN "appearanceJson" JSONB;

CREATE INDEX "User_lockedUntil_idx" ON "User"("lockedUntil");
CREATE INDEX "User_forcePasswordChange_idx" ON "User"("forcePasswordChange");
