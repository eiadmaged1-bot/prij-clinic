CREATE TABLE "PatientFavorite" (
  "id" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatientFavorite_patientId_userId_key" ON "PatientFavorite"("patientId", "userId");
CREATE INDEX "PatientFavorite_userId_createdAt_idx" ON "PatientFavorite"("userId", "createdAt");

ALTER TABLE "PatientFavorite" ADD CONSTRAINT "PatientFavorite_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatientFavorite" ADD CONSTRAINT "PatientFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
