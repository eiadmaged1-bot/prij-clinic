# RBAC And Audit Review

Date: 2026-06-28

## Route Protection Review

Reviewed controllers:

- `AuthController`
- `AdminController`
- `AuditController`
- `PatientsController`
- `AppointmentsController`
- `QueueController`
- `EncountersController`
- `PrescriptionsController`
- `InvestigationsController`
- `ReportsController`
- `PregnancyController`
- `BillingController`
- `DashboardController`
- `AiDraftsController`

Findings:

- Public by design: `GET /health`, `GET /health/db`, and `POST /auth/login`.
- JWT required: every other implemented API route uses `JwtAuthGuard` directly or through class-level guards.
- Permission guard required: protected workflow/admin/audit/dashboard/AI routes use `PermissionsGuard` and route-level `@Permissions`.
- No auth/RBAC bypass was found in the implemented controllers.

## RBAC Gaps To Harden Later

- MVP workflow permissions are coarse in several modules, for example `encounters.manage`, `prescriptions.manage`, `reports.manage`, and `ob_ultrasound.manage`.
- Seed data contains more granular future permission keys such as `encounter.sign`, `prescription.approve`, `report.review`, and `investigation.review`, but current controllers do not yet enforce all of those granular keys.
- Branch and doctor-scope checks are incomplete. Current routes primarily enforce authentication and permission keys, not full branch-scoped record filtering.
- `Owner` receives all seeded permissions for local development. Production roles should be reviewed and narrowed before real clinic use.
- AI draft review currently requires `ai_draft.review`; later approval workflows should distinguish `ai_draft.approve`, `ai_draft.reject`, and target clinical-record permissions before insertion is ever allowed.

## Audit Coverage Review

Implemented audit hooks:

- Auth: login success, login failure, logout.
- Admin/audit reads: admin list reads and audit log reads.
- Patients: create, update.
- Appointments: create, status update.
- Queue: check-in, call, complete, cancel.
- Encounters: create, update, sign.
- Prescriptions: create, update, sign.
- Investigations: create order, status update.
- Reports: create, update, review.
- Pregnancies: create, update.
- OB ultrasound: create, update, review.
- Billing: invoice create, invoice update, invoice issue, payment record, payment reversal.
- AI drafts: placeholder create, review status update.

Audit metadata review:

- Audit metadata generally stores IDs, status transitions, counts, categories, and amounts.
- Audit metadata does not intentionally store passwords, bearer tokens, card numbers, full report files, or external AI prompts.
- Some audit entries include patient IDs and billing amounts as operational metadata.

## Audit Gaps To Harden Later

- Sensitive read auditing is partial. Patient/profile/report/prescription/billing list and detail reads are protected but generally not audited yet.
- Void/cancel flows are incomplete for some clinical resources and should require reason fields when added.
- Signed encounter correction/versioning is not implemented yet.
- Audit event names and permission names should be normalized from MVP plural aliases to final policy names.
- Audit records are append-only through normal app routes, but database-level tamper protection and retention policy are not implemented.

## AI Safety Review

- No external AI SDK, API call, or provider key is present in the implemented AI draft placeholder.
- AI draft generated text is static placeholder text.
- AI draft review changes only the `AiDraft` row and audit log.
- AI draft review records `insertedIntoClinicalRecord: false` in audit metadata.
- No route allows AI to diagnose, prescribe, sign, finalize reports, update encounters, or bypass RBAC.

## OB Ultrasound Safety Review

- OB ultrasound records store structured measurements and free-text draft fields.
- The implementation does not calculate diagnoses, FGR, risk scores, or clinical conclusions from fetal data.
- Review marks the OB ultrasound record reviewed by a user; it does not run image analysis or diagnostic automation.
