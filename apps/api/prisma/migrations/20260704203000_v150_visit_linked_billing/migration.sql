-- v0.15.0 visit-linked billing context.
-- Additive only: preserves existing invoices, payments, visits, and queue records.

ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'transfer';

ALTER TABLE "Invoice"
  ADD COLUMN "appointmentId" UUID,
  ADD COLUMN "queueTicketId" UUID,
  ADD COLUMN "encounterId" UUID;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Invoice_queueTicketId_fkey"
  FOREIGN KEY ("queueTicketId") REFERENCES "QueueTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Invoice_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Invoice_appointmentId_idx" ON "Invoice"("appointmentId");
CREATE INDEX "Invoice_queueTicketId_idx" ON "Invoice"("queueTicketId");
CREATE INDEX "Invoice_encounterId_idx" ON "Invoice"("encounterId");

ALTER TABLE "Payment"
  ADD COLUMN "note" TEXT;
