ALTER TABLE "Patient"
  ADD COLUMN "bloodGroup" TEXT,
  ADD COLUMN "allergyStatus" TEXT NOT NULL DEFAULT 'NOT_ASSESSED';
ALTER TABLE "Pregnancy"
  ADD COLUMN "cycleReliability" TEXT,
  ADD COLUMN "ivfTransferDate" DATE,
  ADD COLUMN "embryoAgeDays" INTEGER,
  ADD COLUMN "datingStatus" TEXT NOT NULL DEFAULT 'UNCONFIRMED',
  ADD COLUMN "datingConfirmedAt" TIMESTAMPTZ(3),
  ADD COLUMN "datingConfirmedByUserId" UUID,
  ADD COLUMN "fetusCount" INTEGER NOT NULL DEFAULT 1;
CREATE TABLE "PatientCareContextTransition" (
  "id" UUID NOT NULL, "patientId" UUID NOT NULL, "previousContext" TEXT NOT NULL,
  "newContext" TEXT NOT NULL, "effectiveAt" TIMESTAMPTZ(3) NOT NULL, "reason" TEXT,
  "actorUserId" UUID NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientCareContextTransition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PatientCareContextTransition_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE TABLE "PregnancyDatingHistory" (
  "id" UUID NOT NULL, "pregnancyId" UUID NOT NULL, "previousEdd" DATE NOT NULL,
  "previousDatingMethod" TEXT, "replacementEdd" DATE NOT NULL, "replacementSource" TEXT NOT NULL,
  "replacementReason" TEXT NOT NULL, "actorUserId" UUID NOT NULL,
  "replacedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PregnancyDatingHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PregnancyDatingHistory_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "Pregnancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE INDEX "PatientCareContextTransition_patientId_effectiveAt_idx" ON "PatientCareContextTransition"("patientId", "effectiveAt");
CREATE INDEX "PregnancyDatingHistory_pregnancyId_replacedAt_idx" ON "PregnancyDatingHistory"("pregnancyId", "replacedAt");
