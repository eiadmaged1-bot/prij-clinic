-- Link a generic only when its existing structured family/class text normalizes
-- exactly to an existing family name or code. Ambiguous records remain unlinked.
WITH generic_terms AS (
  SELECT
    g."id" AS "medicationGenericId",
    ARRAY[
      regexp_replace(lower(trim(coalesce(g."familyName", ''))), '( family| class placeholder| placeholder)$', ''),
      regexp_replace(lower(trim(coalesce(g."className", ''))), '( family| class placeholder| placeholder)$', ''),
      regexp_replace(lower(trim(coalesce(g."pharmacologicClass", ''))), '( family| class placeholder| placeholder)$', '')
    ] AS terms
  FROM "MedicationGeneric" g
  WHERE g."isActive" = true
), family_terms AS (
  SELECT
    f."id" AS "familyId",
    regexp_replace(lower(trim(f."displayName")), '( family| class placeholder| placeholder)$', '') AS display_term,
    lower(trim(f."code")) AS code_term
  FROM "DrugFamily" f
), exact_matches AS (
  SELECT DISTINCT g."medicationGenericId", f."familyId"
  FROM generic_terms g
  CROSS JOIN family_terms f
  WHERE f.display_term = ANY(g.terms) OR f.code_term = ANY(g.terms)
)
INSERT INTO "GenericMedicationFamilyMembership" (
  "id", "medicationGenericId", "familyId", "reviewStatus", "createdAt"
)
SELECT gen_random_uuid(), m."medicationGenericId", m."familyId", 'deterministic_existing_data', CURRENT_TIMESTAMP
FROM exact_matches m
ON CONFLICT ("medicationGenericId", "familyId") DO NOTHING;
