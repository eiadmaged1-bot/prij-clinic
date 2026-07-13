-- Secure external-intake idempotency and replay protection.
ALTER TABLE "ExternalPatientSubmission" ADD COLUMN IF NOT EXISTS "payloadHash" TEXT;
DROP INDEX IF EXISTS "ExternalPatientSubmission_externalSubmissionId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalPatientSubmission_externalSubmissionId_key" ON "ExternalPatientSubmission"("externalSubmissionId");
CREATE INDEX IF NOT EXISTS "ExternalPatientSubmission_payloadHash_idx" ON "ExternalPatientSubmission"("payloadHash");

CREATE TABLE IF NOT EXISTS "ExternalIntakeReplayNonce" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nonceHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalIntakeReplayNonce_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalIntakeReplayNonce_nonceHash_key" ON "ExternalIntakeReplayNonce"("nonceHash");
CREATE INDEX IF NOT EXISTS "ExternalIntakeReplayNonce_expiresAt_idx" ON "ExternalIntakeReplayNonce"("expiresAt");
