# Clinic Workflow Unification

v0.12.5 unifies patient intake, doctor queue selection, live search, prescription drafting, and clinical requests on branch `feature/v0.12.5-clinic-workflow-unification`.

Baseline implementation commit: `e64c25a`.

Safety boundaries:
- No real patient data.
- No automatic diagnosis or prescribing.
- Prescription templates and medication shortcuts are draft aids only.
- Secretary intake is patient-reported until reviewed by a doctor.
- Clinical request follow-up is deterministic and doctor-facing.

Implemented surfaces:
- `PatientIntake` for secretary/reception intake.
- Extended `Encounter` for doctor clinical note fields.
- Prescription templates and doctor medication shortcuts.
- Clinical request aliases over existing investigation request persistence.
- Role-aware `/search/live`.
- Doctor-facing follow-up hints.

Stabilization scope:
- Normalize tests for reason-required queue cancellation and admin service updates.
- Keep RBAC, audit, auth, patient scope, consent, account protection, and AI safety guards intact.
- Clarify local accounts RBAC and staging smoke runner behavior.
- Keep Clinical Requests wording in user-facing status docs while preserving compatible internal route names where still required.
