# Next Steps

The exact next recommended sprint after V0.1 production-readiness foundation is:

## Staging Demo And Pilot QA

Goals:

- Stand up a staging/demo environment using synthetic data only.
- Run CI, security integration, expanded security, consent/privacy, error-safety, and V0.1 E2E tests against staging.
- Perform a backup verification and documented restore rehearsal in a non-production database.
- Pilot QA the full clinic workflow with no real patient data.
- Record usability issues and security gaps without adding clinical automation.
- Keep AI disabled/mock-only.
- Confirm logs contain no PHI, passwords, tokens, report contents, or payment secrets.

Completed before this sprint:

- Centralized referenced-record scope helpers for patient, user, appointment, queue ticket, encounter, investigation order, pregnancy, invoice, payment, and AI draft references.
- Branch/doctor-scope checks on safe create/update/status/review paths for appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, and AI drafts.
- Lower-role matrix documentation for seeded demo roles.
- Expanded referenced-record write-denial tests.
- Expanded audit assertions for representative write/status/sign/review/payment/consent actions.
- Expanded AI regression checks for auth, mock-only behavior, prompt-like input handling, final-record route absence, and no external-provider audit flags.

Completed in the production-readiness foundation sprint:

- Local/CI/staging/production environment examples.
- Runtime environment validation.
- Backup checksum and non-destructive verification.
- Consent/privacy documentation and tests.
- Secure file-storage design foundation with upload implementation deferred.
- Safe error responses, logging/monitoring docs, and incident response foundation.
- Example API/web Dockerfiles and staging/production compose templates.

Do not start production deployment until patient assignment/access policy, production consent enforcement, audit retention/tamper-resistance, backup/restore proof, monitoring, MFA, legal review, and secure PHI file storage are complete.

## Later Hardening

- Add correction/versioning workflows for signed clinical records.
- Add secure report file storage implementation.
- Add production audit retention and tamper-resistance controls.
- Add MFA/2FA and session/device inventory.
- Add monitoring and PHI-safe logging.
- Add production backup encryption, restore tests, and runbooks.
- Keep AI disabled until a separate consent, privacy, provider, RBAC, audit, and doctor-review design is approved.
