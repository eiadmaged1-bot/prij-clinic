# Next Steps

The exact next recommended sprint after V0.1 is:

## Harden Referenced-Record Scope And Lower-Role Permission Matrices

Goals:

- Add full create/update referenced-record branch validation for patient, consent, doctor, appointment, encounter, report, pregnancy, invoice, payment, and AI draft references.
- Add lower-role allowed-path matrices for every route, not only owner positive checks and representative denied-role checks.
- Add audit assertions for every sensitive read and every write/status/sign/review/payment/consent action.
- Add patient-to-doctor assignment or an explicit access model for doctor patient reads.
- Add production-grade consent workflow design before enforcing real consent rules.
- Keep AI disabled/mock-only until consent, provider privacy, RBAC, audit, and doctor-review controls are complete.

Do not start production deployment until referenced-record scope, lower-role matrices, consent enforcement design, backup/restore proof, and secure file storage implementation are stronger.

## Later Hardening

- Add correction/versioning workflows for signed clinical records.
- Add secure report file storage implementation.
- Add production audit retention and tamper-resistance controls.
- Add MFA/2FA and session/device inventory.
- Add monitoring and PHI-safe logging.
- Add production backup encryption, restore tests, and runbooks.
- Keep AI disabled until a separate consent, privacy, provider, RBAC, audit, and doctor-review design is approved.
