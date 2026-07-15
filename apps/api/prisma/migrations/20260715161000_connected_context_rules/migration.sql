-- Deterministic assistive context rules. These rules never diagnose, order, or prescribe.
INSERT INTO "CareAssistRule" (
  "id", "code", "title", "category", "appliesTo", "severity", "triggerJson",
  "messageTemplate", "actionLabel", "evidenceRequired", "sourceType", "sourceName", "isActive", "createdAt", "updatedAt"
)
VALUES
  (gen_random_uuid(), 'PREGNANCY_HYPERTENSION_CONTEXT', 'Pregnancy with hypertension context', 'PREGNANCY_SAFETY', 'PREGNANCY', 'HIGH', '{"type":"deterministic_structured_facts","facts":["active_pregnancy","hypertension_tag"]}'::jsonb, 'Review pathway and missing assessment information. Doctor confirmation required.', 'Review', true, 'deterministic_structured_rule', 'Prij Clinic context rules v1.4.7', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'PCOS_FERTILITY_GOAL_CONTEXT', 'PCOS with fertility goal context', 'CLINICAL_SAFETY_REVIEW', 'PATIENT', 'MODERATE', '{"type":"deterministic_structured_facts","facts":["pcos_tag","fertility_context"]}'::jsonb, 'Review pathway and linked references. Doctor confirmation required.', 'Review', true, 'deterministic_structured_rule', 'Prij Clinic context rules v1.4.7', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'PENICILLIN_ALLERGY_CONTEXT', 'Penicillin allergy context', 'MEDICATION_SAFETY', 'PATIENT', 'HIGH', '{"type":"deterministic_structured_facts","facts":["active_penicillin_allergy"]}'::jsonb, 'Confirm allergy details and review antibiotic protocol.', 'Review', true, 'deterministic_structured_rule', 'Prij Clinic context rules v1.4.7', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'RENAL_IMPAIRMENT_ACTIVE_MEDICINE_CONTEXT', 'Renal impairment with active medication context', 'MEDICATION_SAFETY', 'PATIENT', 'HIGH', '{"type":"deterministic_structured_facts","facts":["renal_impairment_tag","active_medication"]}'::jsonb, 'Review renal guidance and current renal results. No dose change is proposed.', 'Review', true, 'deterministic_structured_rule', 'Prij Clinic context rules v1.4.7', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
