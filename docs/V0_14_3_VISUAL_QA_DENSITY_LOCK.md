# v0.14.3 Visual QA Density Lock

v0.14.3 is a manual visual QA repair sprint, not a clinical feature sprint.

Completed:
- New Patient no longer asks reception to choose sex. OB/GYN patient creation defaults sex to `female` internally when blank or omitted.
- Sexual activity status remains optional under Sensitive clinical details with respectful wording.
- Sidebar supports desktop collapse, mobile drawer overlay, internal scroll, bottom padding, and local persistence.
- Density lock classes standardize mini metrics, compact panels, dense lists, compact empty states, and collapsed help panels.
- Calendar, reception today, check-in, patient summary, doctor current patient, Protocol Atlas, AI Drafts, medication reference, official medicine data, and accounts received compact UI repairs.

Safety unchanged:
- No real patient data.
- No external AI.
- AI remains draft-only and doctor-review-only.
- Medication reference strength/form remains market metadata only, never patient dose instructions.
