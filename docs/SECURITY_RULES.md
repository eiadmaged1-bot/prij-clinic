# Security Rules

## Security Position
Prij Clinic handles sensitive clinic and women's health information. The system must be designed as private-by-default, least-privilege, auditable software.

This document is an engineering baseline, not a legal compliance claim.

## Non-Negotiable Rules
- Do not commit secrets, API keys, passwords, tokens, private certificates, or patient data.
- Do not use real patient data in development, tests, screenshots, documentation, or seeds.
- Require authentication for all application access.
- Enforce authorization on the server, not only in the UI.
- Audit all clinical record changes and high-risk admin actions.
- Use encrypted transport in deployed environments.
- Keep backups encrypted and access-controlled.

## Role-Based Access Control
Permissions should be explicit and assigned through roles.

Initial roles:
- Admin
- Doctor
- Receptionist
- Nurse or assistant
- Billing
- Read-only auditor

Example permissions:
- patient.read
- patient.create
- patient.update
- appointment.manage
- queue.manage
- encounter.read
- encounter.create
- encounter.update_own
- prescription.manage
- investigation.manage
- billing.manage
- payment.manage
- user.manage
- role.manage
- audit.read
- backup.manage

## Authentication
- Store password hashes only, never plaintext passwords.
- Use secure session cookies or equivalent secure token storage.
- Apply session expiration.
- Support account lockout or throttling for repeated failed login attempts.
- Require strong passwords for staff users.
- Plan for multi-factor authentication for admin and doctor accounts.

## Authorization
- Check permissions in API/server handlers for every protected action.
- Prevent users from accessing records outside their authorized clinic scope.
- Restrict destructive actions such as voiding invoices or deleting drafts.
- Prefer soft delete plus audit trail for sensitive records.

## Privacy and Logging
- Logs must not include full patient records, clinical notes, report contents, passwords, tokens, or payment secrets.
- Error messages must not reveal sensitive internal details.
- Export actions must be permission-controlled and audit logged.
- Screenshots used for development or demos must use fake data only.

## Backups
- Back up database data on a documented schedule.
- Encrypt backups.
- Limit backup access to authorized admins/system operators.
- Test restore procedures regularly.
- Do not store backups in the repository.

## Environment Configuration
- Keep real values in local or deployment secrets managers.
- `.env.example` may contain placeholder names only.
- Required environment variables should be documented before implementation.

## Security Review Checklist
- Are all sensitive endpoints authenticated?
- Are authorization checks server-side?
- Are clinical writes audit logged?
- Are secrets excluded from git?
- Are backups encrypted and restore-tested?
- Are demo/test data clearly fake?
