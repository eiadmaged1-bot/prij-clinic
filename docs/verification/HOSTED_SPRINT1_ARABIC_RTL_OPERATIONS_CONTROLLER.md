# Hosted Sprint 1 Arabic and RTL Operations Controller

Target application branch: `work/arabic-rtl-operations-v1`

This controller implements and verifies one large critical-operations package:

- pre-paint Arabic/English language restoration;
- document-level `lang` and `dir` synchronization;
- cross-tab language synchronization;
- bilingual autosave and conflict-recovery controls;
- bilingual active-visit navigation, signing, voiding, encounter, medication, ultrasound, and follow-up controls;
- bilingual doctor queue handoff and safe queue rules;
- logical RTL layout with LTR isolation for MRNs, visit IDs, queue numbers, dates, telephone numbers, and numeric inputs;
- critical-source mojibake removal and Arabic/English dictionary parity verification.

The controller runs full Offline Sync Health, Patient Safety Core, Reception and Queue Core, Features 46–49, medication regressions, typecheck, production build, exact scope, evidence generation, and push.

Safety boundaries: no migration, seed, reset, deletion, truncation, production-data mutation, or secret change.
