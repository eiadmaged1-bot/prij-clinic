ALTER TABLE "Patient" ADD COLUMN "qrToken" UUID;

UPDATE "Patient"
SET "qrToken" = gen_random_uuid()
WHERE "qrToken" IS NULL;

ALTER TABLE "Patient" ALTER COLUMN "qrToken" SET NOT NULL;
ALTER TABLE "Patient" ALTER COLUMN "qrToken" SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX "Patient_qrToken_key" ON "Patient"("qrToken");
