ALTER TABLE "PatientClinicalTag"
  ADD COLUMN "isRemoved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "removedAt" TIMESTAMPTZ(3),
  ADD COLUMN "removalReason" TEXT;

CREATE TABLE "PatientClinicalTagAmendment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tagId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "actorUserId" UUID,
  "action" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "beforeJson" JSONB NOT NULL,
  "afterJson" JSONB,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientClinicalTagAmendment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PatientClinicalTag_patientId_isRemoved_idx" ON "PatientClinicalTag"("patientId", "isRemoved");
CREATE INDEX "PatientClinicalTagAmendment_tagId_createdAt_idx" ON "PatientClinicalTagAmendment"("tagId", "createdAt");
CREATE INDEX "PatientClinicalTagAmendment_patientId_createdAt_idx" ON "PatientClinicalTagAmendment"("patientId", "createdAt");
CREATE INDEX "PatientClinicalTagAmendment_actorUserId_idx" ON "PatientClinicalTagAmendment"("actorUserId");

ALTER TABLE "PatientClinicalTagAmendment" ADD CONSTRAINT "PatientClinicalTagAmendment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "PatientClinicalTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalTagAmendment" ADD CONSTRAINT "PatientClinicalTagAmendment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientClinicalTagAmendment" ADD CONSTRAINT "PatientClinicalTagAmendment_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
