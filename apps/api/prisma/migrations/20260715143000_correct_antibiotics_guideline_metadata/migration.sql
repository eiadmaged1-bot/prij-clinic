UPDATE "GuidelineDocument"
SET
  "title" = 'Antibiotics for Obstetrics and Gynecology',
  "organization" = 'KFS General Hospital Clinical Pharmacy Unit',
  "versionLabel" = 'July 2026',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "title" = 'Antibiotics'
  AND "organization" = 'Private Licensed Upload';

-- Governance status is intentionally unchanged. Clinic approval requires a recorded review decision.
