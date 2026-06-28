# Next Steps

The exact next recommended sprint after V0.1 is:

## Production Security Readiness Hardening

Goals:

- Add patient-to-doctor assignment or an explicit access model for doctor patient reads.
- Add exhaustive lower-role positive-path matrices for every route and state transition, beyond current representative denied-role coverage.
- Add production-grade audit retention, tamper-resistance, export review, and alerting controls.
- Add production consent enforcement design before enforcing real consent rules.
- Add secure PHI file storage implementation with encryption, access control, malware scanning, audit logging, and expiring links.
- Add production backup encryption, restore proof, runbooks, monitoring, MFA, and legal/privacy review.
- Keep AI disabled/mock-only until consent, provider privacy, RBAC, audit, and doctor-review controls are complete.

Completed in the referenced-record hardening sprint:

- Centralized referenced-record scope helpers for patient, user, appointment, queue ticket, encounter, investigation order, pregnancy, invoice, payment, and AI draft references.
- Branch/doctor-scope checks on safe create/update/status/review paths for appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, and AI drafts.
- Lower-role matrix documentation for seeded demo roles.
- Expanded referenced-record write-denial tests.
- Expanded audit assertions for representative write/status/sign/review/payment/consent actions.
- Expanded AI regression checks for auth, mock-only behavior, prompt-like input handling, final-record route absence, and no external-provider audit flags.

Do not start production deployment until patient assignment/access policy, consent enforcement, audit retention/tamper-resistance, backup/restore proof, monitoring, MFA, legal review, and secure PHI file storage are stronger.

## Later Hardening

- Add correction/versioning workflows for signed clinical records.
- Add secure report file storage implementation.
- Add production audit retention and tamper-resistance controls.
- Add MFA/2FA and session/device inventory.
- Add monitoring and PHI-safe logging.
- Add production backup encryption, restore tests, and runbooks.
- Keep AI disabled until a separate consent, privacy, provider, RBAC, audit, and doctor-review design is approved.
