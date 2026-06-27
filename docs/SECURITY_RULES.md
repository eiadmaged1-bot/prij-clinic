# Security Rules

## Security Position
Prij Clinic handles sensitive clinic and women's health information. The system must be designed as private-by-default, least-privilege, auditable software.

This document is an engineering baseline, not a legal compliance claim.

## Non-Negotiable Rules
- Do not commit secrets, API keys, passwords, tokens, private certificates, or patient data.
- Do not use real patient data in development, tests, screenshots, documentation, or seeds.
- Require authentication for all application access.
- Enforce authorization on the server, not only in the UI.
- Audit all clinical record changes, sensitive reads/exports, consent changes, billing adjustments, and high-risk admin actions.
- Use encrypted transport in deployed environments.
- Keep backups encrypted and access-controlled.
- Keep clinical AI output draft-only until a doctor explicitly reviews and approves it.

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
- patient.consent_manage
- appointment.manage
- queue.manage
- vitals.create
- prep_note.create
- encounter.read
- encounter.create
- encounter.update_own
- encounter.sign
- encounter.correct_signed
- prescription.manage
- prescription.approve
- investigation.manage
- report.read
- report.upload
- report.review
- report.export
- billing.manage
- payment.manage
- billing.adjust
- user.manage
- role.manage
- audit.read
- backup.manage

RBAC requirements:
- Permissions must be checked in server/API handlers for every protected action.
- Users must not gain access only because UI routes or buttons are hidden.
- Clinical scopes should account for clinic, branch, doctor, role, and assignment where applicable.
- Administrative users should not automatically bypass clinical privacy rules unless a specific permission grants access.
- Emergency or override access, if added later, must require a reason and create a high-severity audit event.

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
- Require a reason for voids, destructive corrections, billing reversals, consent overrides, and exceptional access.
- Restrict report download/export separately from report viewing.

## Consent
- Store consent records as structured data, not only free text.
- Track consent type, status, recorded user, timestamp, and notes.
- Consent changes, withdrawals, and overrides must be audit logged.
- The UI and server should prevent or warn on workflows that require missing or withdrawn consent.
- Future data sharing, AI processing, messaging, or integration workflows must define their required consent before implementation.

## Privacy and Logging
- Logs must not include full patient records, clinical notes, report contents, passwords, tokens, or payment secrets.
- Error messages must not reveal sensitive internal details.
- Export actions must be permission-controlled and audit logged.
- Screenshots used for development or demos must use fake data only.
- Sensitive read auditing should cover patient profiles, encounters, prescriptions, reports, billing records, exports, and backup metadata where appropriate.
- Audit summaries should contain enough context for accountability without duplicating full clinical note bodies or report contents.
- Uploaded report files must be stored outside the repository in access-controlled storage.
- Direct object/file URLs must not bypass authentication and authorization checks.

## Backups
- Back up database data on a documented schedule.
- Encrypt backups.
- Limit backup access to authorized admins/system operators.
- Test restore procedures regularly.
- Do not store backups in the repository.
- Record backup runs and restore tests in audit or backup metadata.
- Define retention, rotation, failure alerting, and restore ownership before production use.
- Restore tests must verify that RBAC, audit logs, clinical records, billing records, report metadata, and consent records are recoverable.
- Report file/object storage backup strategy must be documented separately from database backup if files are stored outside the database.

## Environment Configuration
- Keep real values in local or deployment secrets managers.
- `.env.example` may contain placeholder names only.
- Required environment variables should be documented before implementation.

## Security Review Checklist
- Are all sensitive endpoints authenticated?
- Are authorization checks server-side?
- Are clinical writes audit logged?
- Are sensitive reads, downloads, and exports audit logged?
- Are consent changes and overrides audit logged?
- Are secrets excluded from git?
- Are backups encrypted and restore-tested?
- Are report files stored outside the repository with access controls?
- Are billing adjustments, refunds, voids, and payment changes permission-controlled?
- Are AI outputs draft-only and blocked from final records until doctor approval?
- Are demo/test data clearly fake?
