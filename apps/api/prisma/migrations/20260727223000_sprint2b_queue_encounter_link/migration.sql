ALTER TABLE "Encounter"
  ADD COLUMN "queueTicketId" UUID,
  ADD COLUMN "visitType" "VisitType";

CREATE UNIQUE INDEX "Encounter_queueTicketId_key"
  ON "Encounter"("queueTicketId");

ALTER TABLE "Encounter"
  ADD CONSTRAINT "Encounter_queueTicketId_fkey"
  FOREIGN KEY ("queueTicketId")
  REFERENCES "QueueTicket"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
