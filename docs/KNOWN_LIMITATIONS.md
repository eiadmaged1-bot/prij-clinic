# Known Limitations

- v0.14.4 walkthrough regression is static/source-level. Full browser visual QA and role-by-role workflow execution remain manual.
- `/clinic-day/walkthrough` points to module routes for patient-specific steps; the operator must open the synthetic patient profile after creation.
- Print packet route requires an existing patient id: `/patients/[id]/print/packet`.
- Clinical requests reuse existing investigation request tables internally for migration safety.
- Prescription builder patient attachment now uses the shared searchable PatientPicker; deeper browser E2E coverage is still needed.
- Appointment drawer patient selection still needs a full workflow pass if long-list selection is added there.
- Some patient action drawer fields still use text placeholders for doctor/room until provider and room setup is expanded.
- Local/demo account creation allows short passwords and short login IDs only outside production.
- Blank account email is stored with an internal non-login `@accounts.prij.local` compatibility value because the current User schema still requires a unique email.
- Official medicine source verification does not mean clinical safety verification.
- Live search ranking is local UI ordering over existing API results; it does not add clinical recommendations.
- Follow-up hints are read-only in this sprint.
- Manual QA is still required for role-by-role browser behavior.
- No external AI, WhatsApp, DICOM/PACS, payment gateway, pharmacy inventory, or automatic clinical decisioning is included.
# Known Limitations

v0.15.0 is still an MVP business layer on top of the locked demo walkthrough.

- Billing is clinic operations only, not a full accounting ledger.
- Payments are manual records only; there is no real payment gateway.
- Insurance/TPA workflows are not implemented.
- Patient statements are print-friendly views, not audited PHI exports.
- Clinic settings polish is mostly UI/documentation-level unless an existing audited setting already supports the change.
- Branch/room expansion remains intentionally limited.
- No real patient data should be seeded or imported.
- Clinical AI remains assistive and draft-only.
- The system does not automatically diagnose, prescribe, dose, or rank treatments.
