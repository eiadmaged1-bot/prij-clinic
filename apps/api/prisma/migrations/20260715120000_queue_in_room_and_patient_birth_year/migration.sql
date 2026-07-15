ALTER TYPE "QueueTicketStatus" ADD VALUE IF NOT EXISTS 'in_room';

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "yearOfBirth" INTEGER;

ALTER TABLE "Patient"
  ADD CONSTRAINT "Patient_yearOfBirth_check"
  CHECK ("yearOfBirth" IS NULL OR ("yearOfBirth" >= 1900 AND "yearOfBirth" <= 2200)) NOT VALID;

ALTER TABLE "Patient" VALIDATE CONSTRAINT "Patient_yearOfBirth_check";
