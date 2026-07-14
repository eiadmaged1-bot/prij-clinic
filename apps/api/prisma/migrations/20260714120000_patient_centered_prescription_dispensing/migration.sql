ALTER TABLE "PrescriptionItem"
  ADD COLUMN "quantityText" TEXT,
  ADD COLUMN "dispensingUnit" TEXT,
  ADD COLUMN "entrySource" TEXT NOT NULL DEFAULT 'unclassified',
  ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'review_required';
