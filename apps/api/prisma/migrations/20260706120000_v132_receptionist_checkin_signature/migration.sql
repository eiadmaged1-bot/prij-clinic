ALTER TABLE "QueueTicket"
  ADD COLUMN "receptionistUserId" UUID,
  ADD COLUMN "receptionistDisplayNameSnapshot" TEXT,
  ADD COLUMN "checkInMethod" TEXT,
  ADD COLUMN "visitTypeChangedByUserId" UUID,
  ADD COLUMN "visitTypeChangeReason" TEXT;

CREATE INDEX "QueueTicket_receptionistUserId_idx" ON "QueueTicket"("receptionistUserId");
