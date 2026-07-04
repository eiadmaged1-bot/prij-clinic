# Clinic Workflow Unification

v0.12.5 unifies patient intake, doctor queue selection, live search, prescription drafting, and clinical requests.

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

