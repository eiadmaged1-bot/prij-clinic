# Verified Protocol Pack 2: AUB and Menstrual Disorders

Status: implemented for local demo and regression testing.

This pack adds verified gynecology management snapshots for abnormal uterine bleeding and menstrual disorder workflows. The output is concise doctor-review support, not a diagnostic or prescribing engine.

Safety boundaries:
- No automatic diagnosis.
- No automatic hormone prescription.
- No medication dose schedules.
- Pregnancy possibility, hemodynamic concern, severe pain, malignancy concern, and postmenopausal bleeding are handled as safety/referral checks.
- Source metadata is present; uncertain source URLs remain blank pending clinical governance review.

Verified codes:
ABNORMAL_UTERINE_BLEEDING, HEAVY_MENSTRUAL_BLEEDING, INTERMENSTRUAL_BLEEDING, POSTCOITAL_BLEEDING, POSTMENOPAUSAL_BLEEDING, PRIMARY_AMENORRHEA, SECONDARY_AMENORRHEA, OLIGOMENORRHEA, POLYMENORRHEA, DYSMENORRHEA_PRIMARY, DYSMENORRHEA_SECONDARY, PMS, PMDD, ADOLESCENT_MENSTRUAL_DISORDERS, ANOVULATORY_BLEEDING, COAGULOPATHY_RELATED_HEAVY_BLEEDING, IATROGENIC_ABNORMAL_BLEEDING.
