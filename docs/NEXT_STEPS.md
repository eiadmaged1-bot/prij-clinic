# Next Steps

The exact next recommended sprint after the V0.1 premium UI demo is:

## V0.1 Pilot QA And Usability Hardening

Goals:

- Run role-by-role manual QA for Owner, Admin, Doctor, Nurse, Receptionist, and Accountant.
- Verify the premium UI on desktop, tablet, and mobile viewport widths.
- Add Playwright or equivalent page smoke checks for the main web routes.
- Improve form validation messages without adding new clinical features.
- Confirm every page keeps the "Demo/local only - no real patient data" boundary visible.
- Keep AI disabled/mock-only and doctor-review-only.
- Keep OB ultrasound informational only, with physician interpretation required.
- Capture screenshots for internal demo documentation using fake/demo data only.

## Security And Production-Readiness Hardening

- Add full create/update referenced-record branch validation for patient, consent, doctor, appointment, encounter, report, pregnancy, invoice, payment, and AI draft references.
- Add lower-role allowed-path matrices for every route, not only owner positive checks and representative denied-role checks.
- Add audit assertions for every sensitive read and every write/status/sign/review/payment/consent action.
- Add patient-to-doctor assignment or an explicit access model for doctor patient reads.
- Add production-grade consent workflow design before enforcing real consent rules.
- Add secure report file storage implementation before any real PHI upload.
- Add MFA, monitoring, PHI-safe logging, backup encryption, restore proof, and legal/privacy review before real patient use.

Do not start production deployment until referenced-record scope, lower-role matrices, consent enforcement design, backup/restore proof, secure file storage, and legal/privacy/security review are complete.
