# Medication Intelligence Engine

Prij Clinic now includes a unified clinician-facing medication reference and safety-support engine.

Scope:
- Generic, brand, trade, family/class, herbal, strength, form, route, country, manufacturer, registration-number search.
- Patient medication and allergy lists.
- Draft-only medication safety checks with visible alerts.
- Egypt and Gulf market strength/form/pack variant reference.
- Admin source, connector, import, review, verification, and coverage controls.

Safety boundaries:
- No autonomous prescribing.
- No patient self-medication guidance.
- No automatic dose changes.
- No prescription signing by AI or automation.
- No pharmacy retail workflow.
- Doctor approval is mandatory for clinical decisions and overrides.

Market strength means marketed product variant only, such as `625 mg tablet` or `457 mg/5 mL oral suspension`. It is never converted into patient directions.

V0.7 audit status:

- Medication Intelligence Engine v2 is integrated as a framework.
- It is not a complete Egypt/GCC medicine database yet.
- Demo products are reference/demo rows only.
- Country scope is `EG`, `KSA`, `UAE`, `QAT`, `KWT`, `BHR`, `OMN`, and optional `YEM`.
- Official-source-first import remains pending.
- Retail metadata connectors remain disabled by default.
- Imported rows require review and verification.
- Staging smoke is gated until disabled-AI staging configuration and staging-only demo credentials are provided.
