ALTER TABLE "ClinicalProtocol"
  ADD COLUMN "sourceOrganization" TEXT,
  ADD COLUMN "guidelineCode" TEXT,
  ADD COLUMN "sourcePublicationDate" DATE,
  ADD COLUMN "sourceEdition" TEXT,
  ADD COLUMN "provenanceNote" TEXT;

CREATE INDEX "ClinicalProtocol_guidelineCode_idx" ON "ClinicalProtocol"("guidelineCode");

CREATE OR REPLACE FUNCTION enforce_guideline_canonical_governance()
RETURNS trigger AS $$
BEGIN
  IF NEW."guidelineStatus" = 'ACTIVE' AND (
    NEW."documentType" <> 'official_pdf'
    OR NEW."fileSha256" IS NULL
    OR NEW."localFilePath" IS NULL
  ) THEN
    RAISE EXCEPTION 'Canonical ACTIVE guidelines require a real official PDF hash and private path.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "GuidelineDocument_canonical_governance"
BEFORE INSERT OR UPDATE ON "GuidelineDocument"
FOR EACH ROW EXECUTE FUNCTION enforce_guideline_canonical_governance();

CREATE OR REPLACE FUNCTION enforce_protocol_publication_governance()
RETURNS trigger AS $$
DECLARE
  source_has_pdf boolean;
BEGIN
  IF NEW."publicationState" = 'PUBLISHED' OR NEW."implementationStatus" = 'verified' THEN
    SELECT (d."fileSha256" IS NOT NULL AND d."localFilePath" IS NOT NULL AND d."documentType" = 'official_pdf' AND d."guidelineStatus" = 'ACTIVE')
      INTO source_has_pdf FROM "GuidelineDocument" d WHERE d.id = NEW."sourceDocumentId";
    IF COALESCE(source_has_pdf, false) = false
      OR NULLIF(BTRIM(NEW."sourceOrganization"), '') IS NULL
      OR NULLIF(BTRIM(NEW."guidelineCode"), '') IS NULL
      OR NEW."sourcePublicationDate" IS NULL
      OR (NULLIF(BTRIM(NEW."sourceVersion"), '') IS NULL AND NULLIF(BTRIM(NEW."sourceEdition"), '') IS NULL)
      OR (NULLIF(BTRIM(NEW."sourceUrl"), '') IS NULL AND NULLIF(BTRIM(NEW."provenanceNote"), '') IS NULL)
      OR NEW."exactPageCitationsJson" IS NULL
      OR jsonb_typeof(NEW."exactPageCitationsJson") <> 'array'
      OR jsonb_array_length(NEW."exactPageCitationsJson") = 0
      OR NEW."publicationApprovedByUserId" IS NULL
      OR NEW."publicationApprovedAt" IS NULL THEN
      RAISE EXCEPTION 'Protocol publication requires structured provenance, an ACTIVE real source PDF, exact page citations, and human approval.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE "GuidelineDocument"
SET "guidelineStatus" = 'NEEDS_SOURCE_PDF',
    "ingestStatus" = 'NEEDS_SOURCE_PDF',
    "reviewStatus" = 'NEEDS_SOURCE_PDF'
WHERE "guidelineStatus" = 'ACTIVE'
  AND ("fileSha256" IS NULL OR "localFilePath" IS NULL);

INSERT INTO "AuditLog" ("id", "action", "resourceType", "resourceId", "metadataJson", "severity", "reason", "createdAt")
SELECT gen_random_uuid(), 'guideline.metadata_quarantined', 'GuidelineDocument', d."id",
       jsonb_build_object('fromStatus', 'ACTIVE', 'toStatus', 'NEEDS_SOURCE_PDF'),
       'high', 'Metadata-only guideline quarantined from clinical canonical results.', now()
FROM "GuidelineDocument" d
WHERE d."guidelineStatus" = 'NEEDS_SOURCE_PDF'
  AND d."fileSha256" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "AuditLog" a WHERE a."action" = 'guideline.metadata_quarantined' AND a."resourceId" = d."id");

UPDATE "ClinicalProtocol"
SET "publicationState" = 'LEGACY_UNVERIFIED',
    "implementationStatus" = 'draft'
WHERE "publicationState" = 'SOURCE_VERIFIED_REFERENCE';

UPDATE "ClinicalProtocol"
SET "implementationStatus" = 'draft',
    "publicationState" = CASE WHEN "publicationState" = 'PUBLISHED' THEN 'LEGACY_UNVERIFIED' ELSE "publicationState" END
WHERE "implementationStatus" = 'verified'
  AND "publicationState" <> 'PUBLISHED';

INSERT INTO "AuditLog" ("id", "action", "resourceType", "metadataJson", "severity", "reason", "createdAt")
SELECT gen_random_uuid(), 'protocol.legacy_verified_quarantined', 'ClinicalProtocol',
       jsonb_build_object('code', p."code", 'fromPublicationState', 'SOURCE_VERIFIED_REFERENCE', 'toPublicationState', 'LEGACY_UNVERIFIED'),
       'high', 'Legacy protocol quarantined pending PDF-backed publication review.', now()
FROM "ClinicalProtocol" p
WHERE p."publicationState" = 'LEGACY_UNVERIFIED'
  AND NOT EXISTS (
    SELECT 1 FROM "AuditLog" a
    WHERE a."action" = 'protocol.legacy_verified_quarantined'
      AND a."metadataJson"->>'code' = p."code"
  );
