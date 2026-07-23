UPDATE "InvestigationCatalogItem" SET "category" = 'Cardiac and Functional Tests' WHERE "active" = true AND "category" = 'Cardiac and Functional Testing';
UPDATE "InvestigationCatalogItem" SET "category" = 'Pathology' WHERE "active" = true AND "category" = 'Pathology and Molecular Diagnostics';
UPDATE "InvestigationCatalogItem" SET "category" = 'Procedures and Referrals' WHERE "active" = true AND "category" IN ('Diagnostic Procedures', 'Specialist Referrals and Clearance');

UPDATE "InvestigationCatalogItem"
SET "active" = false
WHERE "active" = true AND "code" IN ('PT', 'INR', 'APTT', 'THROMBOPHILIA_SCREEN', 'TORCH_PANEL');

UPDATE "InvestigationCatalogItem"
SET "aliasesJson" = '["beta hCG", "BHCG", "تحليل حمل رقمي"]'::jsonb
WHERE "code" = 'QUANTITATIVE_SERUM_BETA_HCG';

UPDATE "GuidelineDocument"
SET "documentType" = 'LOCAL_CLINICAL_PROTOCOL',
    "guidelineStatus" = 'NEEDS_REVIEW',
    "reviewStatus" = 'NEEDS_CLINICAL_REVIEW',
    "ingestStatus" = 'NEEDS_SUMMARY'
WHERE "title" = 'Antibiotics for Obstetrics and Gynecology'
  AND "organization" = 'KFS General Hospital Clinical Pharmacy Unit'
  AND "fileSha256" IS NOT NULL
  AND "localFilePath" IS NOT NULL;

INSERT INTO "AuditLog" ("id", "action", "resourceType", "resourceId", "severity", "metadataJson", "createdAt")
SELECT gen_random_uuid(), 'investigation.catalog_legacy_archived', 'investigation_catalog', NULL, 'high',
       jsonb_build_object('codes', ARRAY['PT','INR','APTT','THROMBOPHILIA_SCREEN','TORCH_PANEL'], 'hardDelete', false), CURRENT_TIMESTAMP;

INSERT INTO "AuditLog" ("id", "action", "resourceType", "resourceId", "severity", "metadataJson", "createdAt")
SELECT gen_random_uuid(), 'guideline.local_protocol_reclassified', 'guideline_document', "id", 'high',
       jsonb_build_object('documentType', 'LOCAL_CLINICAL_PROTOCOL', 'reviewStatus', 'NEEDS_CLINICAL_REVIEW', 'ingestStatus', 'NEEDS_SUMMARY'), CURRENT_TIMESTAMP
FROM "GuidelineDocument"
WHERE "title" = 'Antibiotics for Obstetrics and Gynecology'
  AND "organization" = 'KFS General Hospital Clinical Pharmacy Unit';
