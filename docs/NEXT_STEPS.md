# Next Steps

The exact next recommended sprint after V0.1 staging demo release candidate is:

## V0.2 Access Model And Production Security Design

Goals:

- Add explicit patient-to-doctor assignment or a documented clinical access policy.
- Convert representative lower-role positive paths into fuller role-by-role route/state-transition tests.
- Design production consent enforcement with legal/privacy review before blocking real workflows.
- Design secure PHI file storage implementation with encryption, authorization, audit, malware scanning, and expiring access.
- Define production backup encryption, restore proof, retention, ownership, and runbooks.
- Add MFA/session hardening design and implementation plan.
- Define audit retention, tamper-resistance, export, and alerting requirements.
- Keep AI disabled/mock-only until a separate consent, provider privacy, RBAC, audit, and doctor-review design is approved.

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

Completed in the staging demo release-candidate sprint:

- UI polish for landing, login, dashboard, module pages, consent page, workflow links, and demo warnings.
- Pilot QA checklist and role-based manual test plan.
- Local/dev-only `npm run demo:reset` idempotent reseed wrapper.
- Staging runbook and manual-only staging deployment placeholder.
- Pilot demo guide and updated release-candidate documentation.

Do not start production deployment until patient assignment/access policy, production consent enforcement, audit retention/tamper-resistance, backup/restore proof, monitoring, MFA, legal review, and secure PHI file storage are complete.

## Later Hardening

- Add correction/versioning workflows for signed clinical records.
- Add secure report file storage implementation.
- Add production audit retention and tamper-resistance controls.
- Add MFA/2FA and session/device inventory.
- Add monitoring and PHI-safe logging.
- Add production backup encryption, restore tests, and runbooks.
- Keep AI disabled until a separate consent, privacy, provider, RBAC, audit, and doctor-review design is approved.
