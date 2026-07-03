DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "QueueTicket"
    GROUP BY "branchId", ("checkedInAt" AT TIME ZONE 'UTC')::date, "queueNumber"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'QueueTicket duplicate daily queue numbers detected. Clean up duplicate branchId + UTC checkedInAt date + queueNumber rows before applying v0.10.8 migration.';
  END IF;
END $$;

ALTER TABLE "QueueTicket" ADD COLUMN "queueDate" DATE;

UPDATE "QueueTicket"
SET "queueDate" = ("checkedInAt" AT TIME ZONE 'UTC')::date
WHERE "queueDate" IS NULL;

ALTER TABLE "QueueTicket" ALTER COLUMN "queueDate" SET NOT NULL;

DROP INDEX IF EXISTS "QueueTicket_branchId_queueNumber_checkedInAt_key";

CREATE UNIQUE INDEX "QueueTicket_branchId_queueDate_queueNumber_key" ON "QueueTicket"("branchId", "queueDate", "queueNumber");
CREATE INDEX "QueueTicket_branchId_queueDate_status_idx" ON "QueueTicket"("branchId", "queueDate", "status");

ALTER TABLE "Encounter" ADD COLUMN "branchId" UUID;
ALTER TABLE "Encounter" ADD COLUMN "voidedAt" TIMESTAMPTZ(3);
ALTER TABLE "Encounter" ADD COLUMN "voidedByUserId" UUID;
ALTER TABLE "Encounter" ADD COLUMN "voidReason" TEXT;

UPDATE "Encounter" AS e
SET "branchId" = p."branchId"
FROM "Patient" AS p
WHERE e."patientId" = p."id"
  AND e."branchId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Encounter" WHERE "branchId" IS NULL) THEN
    RAISE EXCEPTION 'Encounter branchId backfill failed. Ensure every encounter patient has a branchId before applying v0.10.8 migration.';
  END IF;
END $$;

ALTER TABLE "Encounter" ALTER COLUMN "branchId" SET NOT NULL;

CREATE INDEX "Encounter_branchId_idx" ON "Encounter"("branchId");
CREATE INDEX "Encounter_voidedByUserId_idx" ON "Encounter"("voidedByUserId");

ALTER TABLE "Encounter"
  ADD CONSTRAINT "Encounter_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Encounter"
  ADD CONSTRAINT "Encounter_voidedByUserId_fkey"
  FOREIGN KEY ("voidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
