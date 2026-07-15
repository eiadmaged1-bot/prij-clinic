-- Forward-only correction: Care Assist rule text must not contain dosing language.
UPDATE "CareAssistRule"
SET
  "messageTemplate" = 'Review renal guidance and current renal results. No medication change is proposed.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'RENAL_IMPAIRMENT_ACTIVE_MEDICINE_CONTEXT';
