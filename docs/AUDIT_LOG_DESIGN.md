# Audit Log Design

## Purpose
Audit logging is a core safety and accountability requirement for Prij Clinic. The MVP must audit clinical writes, sensitive reads and exports, report actions, consent changes, billing changes, admin changes, backup operations, restore tests, and future AI draft review decisions.

This document is an engineering baseline, not a legal compliance claim.

## Principles
- Audit logs are append-only through normal application workflows.
- Audit logging happens on the server, close to the permission-checked action.
- Audit events should be written in the same transaction as the protected data change where practical.
- Audit summaries must avoid full clinical note bodies, full report contents, passwords, tokens, payment secrets, and full AI prompts.
- Every destructive, corrective, override, void, refund, reversal, or exceptional access action requires a reason.
- Admins can review audit logs but cannot edit or erase them through normal application screens.

## Audit Event Shape
- `id`
- `actor_user_id`
- `action`
- `resource_type`
- `resource_id`
- `occurred_at`
- `branch_id`
- `ip_address`
- `user_agent`
- `before_summary`
- `after_summary`
- `reason`
- `severity`
- `correlation_id`
- `request_id`

## Severity Levels
- `low`: routine operational action with limited sensitivity.
- `medium`: sensitive read, appointment change, queue update, or non-destructive billing action.
- `high`: clinical write, report download, consent override, billing refund, user permission change, backup action.
- `critical`: exceptional access, suspected security event, restore operation affecting real data, audit export, or future AI misuse attempt.

## Required Audit Coverage

### Authentication and Sessions
- Login success.
- Login failure risk event.
- Logout.
- Password change.
- Password reset requested and completed.
- Account locked or unlocked.
- MFA setup, disable, and challenge failures when implemented.

### Patients and Consent
- Patient created.
- Patient demographics or contact updated.
- Patient profile sensitive read where policy requires.
- Consent created.
- Consent updated.
- Consent withdrawn.
- Consent overridden with reason.

### Appointments and Queue
- Appointment booked.
- Appointment rescheduled.
- Appointment cancelled.
- Appointment marked no-show.
- Queue entry created.
- Queue status changed.
- Queue doctor assignment changed.
- Preparation note created or updated.

### Encounters
- Encounter created.
- Encounter draft updated.
- Encounter signed.
- Signed encounter corrected.
- Encounter voided.
- Encounter exported.
- Sensitive encounter read where policy requires.

### Prescriptions
- Prescription created.
- Prescription item created, updated, or removed.
- Prescription approved.
- Prescription cancelled.
- Prescription replaced.
- Prescription voided.
- Prescription exported when export is enabled.

### Investigations and Reports
- Investigation requested.
- Investigation status updated.
- Investigation cancelled or voided.
- Investigation reviewed.
- Report metadata created or updated.
- Report file uploaded.
- Report viewed.
- Report downloaded or exported.
- Report reviewed by doctor.
- Report corrected, voided, or deleted.

### Billing
- Invoice created.
- Invoice issued.
- Invoice item updated.
- Discount applied.
- Payment recorded.
- Refund recorded.
- Payment reversed.
- Invoice cancelled or voided.
- Billing summary exported.

### Admin and Security
- User created, updated, suspended, or disabled.
- Role created or updated.
- Permission assigned or removed.
- Branch created or updated.
- Security configuration changed.
- Audit log searched or exported where policy requires.

### Backups and Restore
- Backup job started.
- Backup job completed.
- Backup job failed.
- Restore test started or recorded.
- Restore test completed or failed.
- Restore operation against real data, if ever allowed, as critical.

### Future AI Drafts
- AI draft requested.
- AI draft created.
- AI draft viewed.
- AI draft edited by doctor.
- AI draft approved.
- AI draft rejected.
- AI draft expired or voided.
- Approved draft inserted into a clinical record.
- AI action blocked due to missing consent, missing permission, or unsafe workflow.

## Safe Before and After Summaries
Audit summaries should use field-level metadata rather than full sensitive content.

Allowed:
- Changed field names.
- Old and new status values.
- IDs of linked records.
- Short operational labels.
- Counts of items changed.
- Reason codes.

Avoid:
- Full clinical notes.
- Full report text.
- Full AI prompt or output unless a separate encrypted audit content policy is approved.
- Passwords, tokens, API keys, cookies, payment secrets.
- Full patient histories.

## Transaction Pattern
For data changes:
1. Authenticate request.
2. Authorize actor, permission, branch scope, and record scope.
3. Validate request.
4. Apply business rule.
5. Write data change and audit event in one transaction where practical.
6. Return minimum necessary response.

For sensitive reads or exports:
1. Authenticate and authorize.
2. Record audit event before or immediately after access.
3. Return or stream the content only after successful authorization.

## Tamper Resistance
MVP:
- Application-level append-only audit logs.
- No update or delete routes for audit logs.
- Database permissions should prevent normal app users from modifying audit rows.

V1:
- Add hash chaining or external immutable log storage.
- Add alerting for missing audit events, suspicious access patterns, and audit export activity.

## Retention
Audit retention must be decided with clinic owner and qualified legal or compliance advice before real clinic use. Until then, design for configurable retention without deleting audit logs by default.

## Testing Requirements
- Permission-denied actions should not create misleading success audit logs.
- Successful protected mutations must create exactly one expected audit event or a clear parent/child event set.
- Sensitive exports must be audited separately from reads.
- Void, refund, reversal, correction, and consent override routes must reject missing reasons.
