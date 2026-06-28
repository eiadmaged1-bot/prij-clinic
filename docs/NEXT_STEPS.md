# Next Steps

The exact next recommended sprint after route-level security coverage is:

## Harden Referenced-Record Scope And Lower-Role Matrices

Goals:

- Add full create/update referenced-record branch validation for patient, doctor, appointment, encounter, report, pregnancy, invoice, and AI draft references.
- Add lower-role allowed-path matrices for every route, not only owner positive checks and representative denied-role checks.
- Add audit assertions for every sensitive read and every write/status/sign/review/payment action.
- Keep AI disabled/mock-only until consent, provider privacy, RBAC, audit, and doctor-review controls are complete.

Do not start production hardening until referenced-record scope and lower-role matrices are broader.

## Later Hardening

- Add full referenced-record scope validation on create/update paths.
- Model patient-to-doctor assignment and patient timeline permissions.
- Implement consent records and consent enforcement.
- Add correction/versioning workflows for signed clinical records.
- Define production audit retention and tamper-resistance controls.
- Design secure report file storage before accepting PHI files.
- Keep AI disabled until a separate consent, privacy, provider, RBAC, audit, and doctor-review design is approved.
