-- Link serial ultrasound comparisons to their authoritative signed source scan.
ALTER TABLE "ObUltrasound"
ADD COLUMN "comparisonSourceScanId" UUID;

ALTER TABLE "ObUltrasound"
ADD CONSTRAINT "ObUltrasound_comparisonSourceScanId_fkey"
FOREIGN KEY ("comparisonSourceScanId") REFERENCES "ObUltrasound"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ObUltrasound_comparisonSourceScanId_idx"
ON "ObUltrasound"("comparisonSourceScanId");
