ALTER TABLE "GuidelineDocument"
  ADD COLUMN "ingestStatus" TEXT NOT NULL DEFAULT 'NEEDS_SUMMARY',
  ADD COLUMN "importBatch" TEXT;

CREATE INDEX "GuidelineDocument_ingestStatus_idx" ON "GuidelineDocument"("ingestStatus");
CREATE INDEX "GuidelineDocument_importBatch_idx" ON "GuidelineDocument"("importBatch");
CREATE UNIQUE INDEX "GuidelineDocument_fileSha256_key" ON "GuidelineDocument"("fileSha256");

ALTER TABLE "ClinicalProtocol"
  ADD COLUMN "sourceDocumentId" UUID,
  ADD COLUMN "exactPageCitationsJson" JSONB,
  ADD COLUMN "publicationApprovedByUserId" UUID,
  ADD COLUMN "publicationApprovedAt" TIMESTAMPTZ(3);

CREATE INDEX "ClinicalProtocol_sourceDocumentId_idx" ON "ClinicalProtocol"("sourceDocumentId");
ALTER TABLE "ClinicalProtocol" ADD CONSTRAINT "ClinicalProtocol_sourceDocumentId_fkey"
  FOREIGN KEY ("sourceDocumentId") REFERENCES "GuidelineDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION enforce_protocol_publication_governance()
RETURNS trigger AS $$
DECLARE
  source_has_pdf boolean;
BEGIN
  IF NEW."publicationState" = 'PUBLISHED' THEN
    SELECT (d."fileSha256" IS NOT NULL AND d."localFilePath" IS NOT NULL AND d."documentType" = 'official_pdf')
      INTO source_has_pdf FROM "GuidelineDocument" d WHERE d.id = NEW."sourceDocumentId";
    IF COALESCE(source_has_pdf, false) = false
      OR NULLIF(BTRIM(NEW."sourceVersion"), '') IS NULL
      OR NEW."exactPageCitationsJson" IS NULL
      OR jsonb_typeof(NEW."exactPageCitationsJson") <> 'array'
      OR jsonb_array_length(NEW."exactPageCitationsJson") = 0
      OR NEW."publicationApprovedByUserId" IS NULL
      OR NEW."publicationApprovedAt" IS NULL THEN
      RAISE EXCEPTION 'Protocol publication requires a real source PDF, exact version, exact page citations, and human approval.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ClinicalProtocol_publication_governance"
BEFORE INSERT OR UPDATE ON "ClinicalProtocol"
FOR EACH ROW EXECUTE FUNCTION enforce_protocol_publication_governance();
