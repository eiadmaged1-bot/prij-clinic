# Verified Protocol Pack 4: Routine Antenatal Care

Status: implemented for local demo and regression testing.

This pack adds routine antenatal care snapshots. It is a checklist-style doctor support layer for documentation, routine care reminders, screening, vaccination, lifestyle counseling, and escalation prompts.

Safety boundaries:
- No automatic diagnosis.
- No automatic medication approval.
- No dose automation.
- EDD and dating method documentation are prompted but not decided by AI.
- Mental health and domestic violence screening use safe escalation language and require human clinician review.
- Red flags require urgent clinician review.

Verified codes:
ANTENATAL_CARE_ROUTINE, PREGNANCY_DATING, ANTENATAL_SCREENING, ANEMIA_IN_PREGNANCY, NAUSEA_VOMITING_PREGNANCY, HEARTBURN_PREGNANCY, CONSTIPATION_PREGNANCY, BACK_PAIN_PREGNANCY, VARICOSE_VEINS_PREGNANCY, VACCINATION_IN_PREGNANCY, NUTRITION_IN_PREGNANCY, EXERCISE_IN_PREGNANCY, TRAVEL_IN_PREGNANCY, MEDICATION_REVIEW_IN_PREGNANCY, MATERNAL_MENTAL_HEALTH_SCREENING, DOMESTIC_VIOLENCE_SCREENING_PREGNANCY.
