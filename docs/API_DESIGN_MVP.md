# MVP API Design

## Purpose
This document defines the API shape for the Prij Clinic MVP. It is documentation only and should guide implementation after schema and security review.

## API Principles
- All protected routes require authentication.
- Authorization is enforced server-side on every route.
- Branch and clinic scope are checked server-side.
- Clinical writes, sensitive reads, exports, billing changes, report actions, consent changes, admin actions, backup actions, and AI review actions create audit logs.
- Request validation occurs at the API boundary.
- Response payloads return the minimum data needed for the workflow.
- No route returns secrets, password hashes, report storage keys, or payment secrets.

## Route Conventions
- Base path: `/api/v1`.
- IDs are UUIDs.
- Pagination: `?limit=50&cursor=...`.
- Filtering: explicit query parameters only.
- Errors use a consistent shape:

```json
{
  "error": {
    "code": "permission_denied",
    "message": "Action is not allowed.",
    "requestId": "request-id"
  }
}
```

## Auth
- `POST /auth/login`
  - Authenticates staff user.
  - Audits failed login risk events without storing passwords.
- `POST /auth/logout`
  - Ends current session.
- `GET /auth/me`
  - Returns current user, roles, permissions, and branch scopes.
- `POST /auth/password/change`
  - Changes password after current password verification.
- `POST /auth/password/reset-request`
  - Creates reset workflow without disclosing whether an email exists.
- `POST /auth/password/reset-confirm`
  - Completes reset using a secure token handled outside logs.
- `POST /auth/mfa/setup/start`
  - Future-ready route for MFA enrollment.
- `POST /auth/mfa/setup/confirm`
  - Future-ready route for MFA confirmation.
- `POST /auth/mfa/challenge`
  - Future-ready route for MFA login challenge.

## Patients
- `GET /patients`
  - Search patients by allowed fields.
  - Requires `patient.read`.
  - Sensitive search logging should avoid full query content where possible.
- `POST /patients`
  - Creates patient profile.
  - Requires `patient.create`.
  - Uses fake/demo data only in development.
- `GET /patients/{patientId}`
  - Returns permitted patient profile summary.
  - Requires `patient.read`.
  - Sensitive read audit may apply.
- `PATCH /patients/{patientId}`
  - Updates demographics or contact fields.
  - Requires `patient.update`.
  - Audits before/after safe field summary.
- `GET /patients/{patientId}/timeline`
  - Returns permitted timeline items based on viewer permissions.
- `GET /patients/{patientId}/consents`
  - Requires `patient.consent_read`.
- `POST /patients/{patientId}/consents`
  - Creates consent record.
  - Requires `patient.consent_manage`.
  - Audited.
- `PATCH /patients/{patientId}/consents/{consentId}`
  - Updates, withdraws, or overrides consent.
  - Override requires `patient.consent_override` and a reason.

## Appointments
- `GET /appointments`
  - Filters by branch, doctor, date range, and status.
- `POST /appointments`
  - Books appointment.
  - Requires `appointment.manage`.
  - Server checks doctor schedule conflict rules.
- `GET /appointments/{appointmentId}`
  - Returns permitted appointment details.
- `PATCH /appointments/{appointmentId}`
  - Updates editable appointment fields.
- `POST /appointments/{appointmentId}/reschedule`
  - Creates reschedule history and updates status.
- `POST /appointments/{appointmentId}/cancel`
  - Cancels appointment with optional or policy-required reason.
- `POST /appointments/{appointmentId}/no-show`
  - Marks no-show.
- `GET /doctors/{doctorUserId}/calendar`
  - Returns daily or weekly authorized calendar.

## Queue
- `GET /queue`
  - Filters by branch, date, doctor, and status.
- `POST /queue`
  - Adds scheduled patient or walk-in.
  - Requires `queue.manage`.
- `GET /queue/{queueEntryId}`
  - Returns permitted queue entry.
- `PATCH /queue/{queueEntryId}/status`
  - Updates status using allowed transition rules.
  - Requires `queue.status_update`.
- `PATCH /queue/{queueEntryId}/assignment`
  - Assigns or changes doctor if permitted.
- `POST /queue/{queueEntryId}/preparation-notes`
  - Creates nurse or assistant prep note.
  - Requires `prep_note.create`.
- `GET /queue/{queueEntryId}/preparation-notes`
  - Requires `prep_note.read` or doctor encounter access.

## Encounters
- `GET /encounters`
  - Filters by patient, doctor, date range, status.
- `POST /encounters`
  - Creates doctor-authored encounter.
  - Requires `encounter.create`.
- `GET /encounters/{encounterId}`
  - Requires `encounter.read`.
  - Sensitive read audit may apply.
- `PATCH /encounters/{encounterId}`
  - Updates draft encounter.
  - Requires `encounter.update_own` or equivalent permission.
- `POST /encounters/{encounterId}/sign`
  - Signs or finalizes encounter.
  - Requires `encounter.sign`.
  - Doctor-only by policy.
- `POST /encounters/{encounterId}/corrections`
  - Creates appended or versioned correction.
  - Requires `encounter.correct_signed`.
  - Reason required.
- `POST /encounters/{encounterId}/void`
  - Voids where policy allows.
  - Requires explicit permission and reason.

## Prescriptions
- `GET /prescriptions`
  - Filters by patient, encounter, doctor, status.
- `POST /encounters/{encounterId}/prescriptions`
  - Creates prescription draft.
  - Requires `prescription.create`.
- `GET /prescriptions/{prescriptionId}`
  - Requires `prescription.read`.
- `PATCH /prescriptions/{prescriptionId}`
  - Updates draft prescription.
- `POST /prescriptions/{prescriptionId}/items`
  - Adds prescription item.
- `PATCH /prescriptions/{prescriptionId}/items/{itemId}`
  - Updates item while prescription is editable.
- `DELETE /prescriptions/{prescriptionId}/items/{itemId}`
  - Removes item while prescription is editable.
- `POST /prescriptions/{prescriptionId}/approve`
  - Doctor approval only.
  - Requires `prescription.approve`.
- `POST /prescriptions/{prescriptionId}/cancel`
  - Requires reason and audit.
- `POST /prescriptions/{prescriptionId}/replace`
  - Links replacement prescription and audits.

## Investigations
- `GET /investigations`
  - Filters by patient, encounter, category, status, pending review.
- `POST /encounters/{encounterId}/investigations`
  - Creates investigation order.
  - Requires `investigation.create`.
- `GET /investigations/{investigationId}`
  - Requires `investigation.read`.
- `PATCH /investigations/{investigationId}`
  - Updates editable metadata or instructions.
- `PATCH /investigations/{investigationId}/status`
  - Tracks lifecycle status.
- `POST /investigations/{investigationId}/cancel`
  - Requires permission and reason when policy requires.
- `POST /investigations/{investigationId}/void`
  - Requires explicit permission and reason.
- `POST /investigations/{investigationId}/review`
  - Doctor review action.
  - Requires `investigation.review`.

## Reports and External Files
- `GET /reports`
  - Filters by patient, report category, investigation, encounter, review status.
- `POST /reports/upload-request`
  - Creates a controlled upload request after authorization.
  - Requires `report.upload`.
  - Does not expose permanent public file URLs.
- `POST /reports`
  - Creates report metadata linked to uploaded file or external reference.
- `GET /reports/{reportId}`
  - Returns report metadata.
  - Requires `report.read`.
  - Sensitive read audit applies.
- `GET /reports/{reportId}/content`
  - Streams or redirects through authorized short-lived access.
  - Requires `report.read`.
  - Audited.
- `POST /reports/{reportId}/review`
  - Doctor review with note and timestamp.
  - Requires `report.review`.
- `PATCH /reports/{reportId}`
  - Updates metadata where allowed.
- `POST /reports/{reportId}/void`
  - Requires `report.void` and reason.
- `DELETE /reports/{reportId}`
  - Restricted exceptional deletion only.
  - Prefer void workflow.
- `POST /reports/{reportId}/export`
  - Requires `report.export`.
  - Audited separately from read.

Report category-specific routes may be added later if needed, but MVP can use one report API with category-specific metadata.

## Billing
- `GET /billing/invoices`
  - Filters by patient, status, date range, branch.
- `POST /billing/invoices`
  - Creates draft invoice.
  - Requires `billing.manage`.
- `GET /billing/invoices/{invoiceId}`
  - Requires `billing.read`.
- `PATCH /billing/invoices/{invoiceId}`
  - Updates draft invoice.
- `POST /billing/invoices/{invoiceId}/items`
  - Adds invoice item.
- `PATCH /billing/invoices/{invoiceId}/items/{itemId}`
  - Updates draft item.
- `POST /billing/invoices/{invoiceId}/issue`
  - Issues invoice.
- `POST /billing/invoices/{invoiceId}/void`
  - Requires `billing.void` and reason.
- `POST /billing/invoices/{invoiceId}/payments`
  - Records payment.
  - Requires `payment.manage`.
  - Must not store card numbers or payment secrets.
- `POST /billing/payments/{paymentId}/reverse`
  - Requires explicit permission and reason.
- `GET /billing/summary`
  - Requires `billing.report`.

## Admin, Users, Roles, and Branches
- `GET /admin/users`
- `POST /admin/users`
- `GET /admin/users/{userId}`
- `PATCH /admin/users/{userId}`
- `POST /admin/users/{userId}/suspend`
- `POST /admin/users/{userId}/roles`
- `DELETE /admin/users/{userId}/roles/{roleId}`
- `GET /admin/roles`
- `POST /admin/roles`
- `PATCH /admin/roles/{roleId}`
- `POST /admin/roles/{roleId}/permissions`
- `DELETE /admin/roles/{roleId}/permissions/{permissionId}`
- `GET /admin/permissions`
- `GET /admin/branches`
- `POST /admin/branches`
- `PATCH /admin/branches/{branchId}`

All admin mutation routes require explicit admin permissions and audit logs.

## Audit Logs
- `GET /audit-logs`
  - Search by actor, action, resource type, resource ID, severity, branch, date range.
  - Requires `audit.read`.
  - Audit searches themselves should be logged when policy requires.
- `GET /audit-logs/{auditLogId}`
  - Returns one audit event.
- `POST /audit-logs/export`
  - Requires `audit.export`.
  - Audited.

Normal application workflows must not update or delete audit logs.

## Backups and Restore Metadata
- `GET /backups/runs`
  - Requires `backup.metadata_read`.
- `POST /backups/runs`
  - Starts or records backup job if permitted.
  - Requires `backup.manage`.
- `GET /backups/runs/{backupRunId}`
- `POST /backups/runs/{backupRunId}/restore-tests`
  - Records restore test result.
  - Requires `restore_test.manage`.
- `GET /backups/restore-tests`

Backup files themselves are not served through normal app routes in the MVP.

## AI Draft Review
AI routes are future-ready design and not part of MVP implementation unless explicitly approved later.

- `POST /ai/drafts`
  - Creates AI draft request.
  - Requires `ai_draft.request`.
  - Must check consent, RBAC, and minimum necessary input.
- `GET /ai/drafts`
  - Lists permitted AI drafts.
- `GET /ai/drafts/{draftId}`
  - Requires `ai_draft.read`.
  - AI draft view is audited.
- `POST /ai/drafts/{draftId}/review`
  - Doctor review decision: approve, edit and approve, reject, expire, or void.
  - Requires `ai_draft.review` and doctor scope.
- `POST /ai/drafts/{draftId}/insert-approved`
  - Inserts approved text into a final editable clinical record only through explicit doctor action.
  - Requires clinical record permission and doctor approval.

AI must not sign records, approve prescriptions, override permissions, bypass consent, or diagnose independently.
