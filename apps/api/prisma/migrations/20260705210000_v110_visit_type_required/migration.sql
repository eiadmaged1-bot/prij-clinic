CREATE TYPE "VisitType" AS ENUM ('kashf', 'recheck', 'consultation', 'urgent_kashf');

ALTER TABLE "QueueTicket"
ADD COLUMN "visitType" "VisitType" NOT NULL DEFAULT 'kashf';

ALTER TABLE "QueueTicket"
ALTER COLUMN "visitType" DROP DEFAULT;

CREATE INDEX "QueueTicket_branchId_queueDate_visitType_idx" ON "QueueTicket"("branchId", "queueDate", "visitType");
