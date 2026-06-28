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
- Permission guard required: protected workflow, admin, audit, dashboard, billing, clinical, and AI draft routes use route permissions.
- No implemented route intentionally bypasses auth/RBAC.

## RBAC Status

- Granular permissions are enforced for patients, appointments, queue status changes, encounters, prescriptions, investigations, reports, billing, dashboard, and AI drafts.
- Pregnancy and OB ultrasound use the current MVP permission names `pregnancy.read`, `pregnancy.manage`, `ob_ultrasound.read`, and `ob_ultrasound.manage`.
- Owner/Admin local demo access remains broad so the seeded local owner can run smoke tests and review the foundation.
- Non-owner/non-admin reads are branch-scoped where the current data model supports it.
- Doctor-owned records are doctor-scoped for appointments, encounters, prescriptions, and investigation orders.

## Audit Coverage

Implemented audit hooks include:

- Auth: login success, login failure, logout.
- Admin/audit reads: admin list reads and audit log reads.
- Patients: create, list read, detail read, update.
- Appointments: create, status update.
- Queue: check-in, call, complete, cancel.
- Encounters: create, list read, detail read, update, sign.
- Prescriptions: create, list read, detail read, update, sign.
- Investigations: create order, status update.
- Reports: create, list read, detail read, update, review.
- Pregnancies: create, list read, detail read, update.
- OB ultrasound: create, list read, detail read, update, review.
- Billing: invoice create, list read, detail read, update, issue, payment record, payment reversal.
- AI drafts: placeholder create, list read, detail read, review status update.

Audit metadata is intentionally limited to IDs, actions, statuses, counts, categories, branch IDs, amounts where operationally needed, and safety flags. Audit code must not log passwords, bearer tokens, card numbers, raw report files, raw clinical note bodies, or external AI prompts.

## Remaining Gaps

- Create endpoints still need deeper validation that referenced patient, doctor, appointment, encounter, report, pregnancy, and invoice IDs are in the actor's allowed branch/scope.
- Patient-to-doctor assignment is not modeled yet, so patient reads are branch-scoped but not assigned-doctor scoped.
- Void/cancel/correction workflows are incomplete for several clinical and billing resources.
- Audit logs are append-only through application code but do not yet have database-level tamper resistance, retention policy, or export review controls.
- Sensitive export/download audit coverage remains future work because file storage and export workflows are not implemented.

## AI Safety Review

- No external AI SDK, provider call, model endpoint, or API key is present.
- AI draft generated text is static disabled/mock placeholder text.
- AI draft review changes only the `AiDraft` row and audit log.
- AI draft review records `insertedIntoClinicalRecord: false`.
- No route allows AI to diagnose, prescribe, sign, finalize reports, update encounters, override RBAC, bypass consent, or bypass doctor approval.

## OB Ultrasound Safety Review

- OB ultrasound records store structured measurements and findings only.
- The implementation does not calculate diagnoses, fetal growth restriction, risk scores, or clinical conclusions from fetal data.
- No fetal-image AI or diagnostic automation is implemented.

## Automated Security Checks

Local scripts now cover representative RBAC, scope, audit, and AI safety behavior:

- `npm run test:rbac`
- `npm run test:scope`
- `npm run test:audit`
- `npm run test:ai-safety`
- `npm run test:security`

These scripts require a seeded local database and running API/web apps. They are intentionally local security smoke tests and are not exhaustive production security tests.

Expanded V0.1 route-level checks are also available:

- `npm run test:routes:auth`: route manifest coverage for anonymous denial, owner allow, and representative denied-role checks.
- `npm run test:scope:records`: seeded branch scope assertions plus documented warnings for referenced-record and doctor-assignment gaps.
- `npm run test:audit:assertions`: audit event assertions for representative writes/status/review actions and token minimization.
- `npm run test:ai:regression`: disabled/mock-only AI regression checks, including no sign/insert/diagnose/prescribe routes.
- `npm run test:security:expanded`: aggregate runner for expanded checks.

The expanded tests are V0.1 pilot safety tests, not production certification.
