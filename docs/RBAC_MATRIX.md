# RBAC Matrix

Date: 2026-06-28

This matrix documents the implemented MVP routes after the `RBAC + Branch/Patient Scope Enforcement` hardening sprint.

## Public Routes

| Method | Path | Auth | Permission | Expected roles | Notes |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/health` | No | None | Public health monitor | No patient data. |
| `GET` | `/health/db` | No | None | Public health monitor | Confirms database connectivity only. |
| `POST` | `/auth/login` | No | None | Staff with local account | Audits success/failure. |

## Protected Routes

| Method | Path | Auth | Permission | Expected roles | Notes |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/auth/me` | JWT | Authenticated user | All staff | Returns safe user, roles, permissions. |
| `POST` | `/auth/logout` | JWT | Authenticated user | All staff | Audits logout. |
| `GET` | `/admin/users` | JWT | `user.read` | Owner, Admin | Audited admin read. |
| `GET` | `/admin/roles` | JWT | `role.read` | Owner, Admin | Audited admin read. |
| `GET` | `/admin/permissions` | JWT | `permission.read` | Owner, Admin | Audited admin read. |
| `GET` | `/audit` | JWT | `audit.read` | Owner, Admin, Auditor later | Audits audit-log read. |
| `POST` | `/patients` | JWT | `patient.create` | Owner, Receptionist | Branch assigned from user context. |
| `GET` | `/patients` | JWT | `patient.read` | Owner, Doctor, Nurse, Receptionist, Accountant limited | Branch-scoped for non-owner/non-admin users. Sensitive read audit. |
| `GET` | `/patients/:id` | JWT | `patient.read` | Owner, Doctor, Nurse, Receptionist, Accountant limited | Branch-scoped for non-owner/non-admin users. Sensitive read audit. |
| `PATCH` | `/patients/:id` | JWT | `patient.update` | Owner, Receptionist | Branch-scoped lookup before update. |
| `POST` | `/appointments` | JWT | `appointment.manage` | Owner, Receptionist | TODO: fully enforce branch scope for referenced patient/doctor. |
| `GET` | `/appointments` | JWT | `appointment.read` | Owner, Doctor, Nurse, Receptionist | Branch-scoped; doctors see own doctorId records. |
| `GET` | `/appointments/calendar` | JWT | `appointment.read` | Owner, Doctor, Nurse, Receptionist | Branch-scoped; doctors see own doctorId records. |
| `GET` | `/appointments/:id` | JWT | `appointment.read` | Owner, Doctor, Nurse, Receptionist | Branch-scoped; doctors see own doctorId records. |
| `PATCH` | `/appointments/:id/status` | JWT | `appointment.manage` | Owner, Receptionist | Branch-scoped lookup before status update. |
| `POST` | `/queue/check-in` | JWT | `queue.manage` | Owner, Receptionist | TODO: fully enforce branch scope for patient lookup. |
| `GET` | `/queue/today` | JWT | `queue.read` | Owner, Doctor, Nurse, Receptionist | Branch-scoped for non-owner/non-admin users. |
| `PATCH` | `/queue/:id/call` | JWT | `queue.status_update` | Owner, Nurse, Receptionist | Branch-scoped for non-owner/non-admin users. |
| `PATCH` | `/queue/:id/complete` | JWT | `queue.status_update` | Owner, Nurse, Receptionist | Branch-scoped for non-owner/non-admin users. |
| `PATCH` | `/queue/:id/cancel` | JWT | `queue.status_update` | Owner, Nurse, Receptionist | Branch-scoped for non-owner/non-admin users. |
| `POST` | `/encounters` | JWT | `encounter.create` | Owner, Doctor | TODO: fully enforce branch scope for referenced patient. |
| `GET` | `/encounters` | JWT | `encounter.read` | Owner, Doctor, Nurse limited | Branch-scoped; doctors see own doctorId records. Sensitive read audit. |
| `GET` | `/encounters/:id` | JWT | `encounter.read` | Owner, Doctor, Nurse limited | Branch-scoped; doctors see own doctorId records. Sensitive read audit. |
| `PATCH` | `/encounters/:id` | JWT | `encounter.update_own` | Owner, Doctor | Branch/doctor scoped lookup before update. |
| `PATCH` | `/encounters/:id/sign` | JWT | `encounter.sign` | Owner, Doctor | Branch/doctor scoped lookup before sign. |
| `POST` | `/prescriptions` | JWT | `prescription.create` | Owner, Doctor | TODO: fully enforce branch scope for referenced patient. |
| `GET` | `/prescriptions` | JWT | `prescription.read` | Owner, Doctor, Nurse limited | Branch-scoped; doctors see own doctorId records. Sensitive read audit. |
| `GET` | `/prescriptions/:id` | JWT | `prescription.read` | Owner, Doctor, Nurse limited | Branch-scoped; doctors see own doctorId records. Sensitive read audit. |
| `PATCH` | `/prescriptions/:id` | JWT | `prescription.update` | Owner, Doctor | Branch/doctor scoped lookup before update. |
| `PATCH` | `/prescriptions/:id/sign` | JWT | `prescription.approve` | Owner, Doctor | Existing route name is `sign`; permission reflects doctor approval. |
| `POST` | `/investigations/orders` | JWT | `investigation.create` | Owner, Doctor | TODO: fully enforce branch scope for referenced patient. |
| `GET` | `/investigations/orders` | JWT | `investigation.read` | Owner, Doctor, Nurse limited | Branch-scoped; doctors see own doctorId records. |
| `GET` | `/investigations/orders/:id` | JWT | `investigation.read` | Owner, Doctor, Nurse limited | Branch-scoped; doctors see own doctorId records. |
| `PATCH` | `/investigations/orders/:id/status` | JWT | `investigation.update` | Owner, Doctor, Nurse limited | Branch/doctor scoped lookup before status update. |
| `POST` | `/reports` | JWT | `report.upload` | Owner, Doctor | Metadata/reference only; no file storage. |
| `GET` | `/reports` | JWT | `report.read` | Owner, Doctor, Nurse limited | Branch-scoped for non-owner/non-admin users. Sensitive read audit. |
| `GET` | `/reports/:id` | JWT | `report.read` | Owner, Doctor, Nurse limited | Branch-scoped for non-owner/non-admin users. Sensitive read audit. |
| `PATCH` | `/reports/:id` | JWT | `report.update` | Owner, Doctor | Branch-scoped lookup before update. |
| `PATCH` | `/reports/:id/review` | JWT | `report.review` | Owner, Doctor | Branch-scoped lookup before review. |
| `POST` | `/pregnancies` | JWT | `pregnancy.manage` | Owner, Doctor | TODO: fully enforce branch scope for referenced patient. |
| `GET` | `/pregnancies` | JWT | `pregnancy.read` | Owner, Doctor, Nurse limited | Branch-scoped. Sensitive read audit. |
| `GET` | `/pregnancies/:id` | JWT | `pregnancy.read` | Owner, Doctor, Nurse limited | Branch-scoped. Sensitive read audit. |
| `PATCH` | `/pregnancies/:id` | JWT | `pregnancy.manage` | Owner, Doctor | Branch-scoped lookup before update. |
| `POST` | `/ob-ultrasounds` | JWT | `ob_ultrasound.manage` | Owner, Doctor | Stores data only; no automated diagnosis. |
| `GET` | `/ob-ultrasounds` | JWT | `ob_ultrasound.read` | Owner, Doctor, Nurse limited | Branch-scoped. Sensitive read audit. |
| `GET` | `/ob-ultrasounds/:id` | JWT | `ob_ultrasound.read` | Owner, Doctor, Nurse limited | Branch-scoped. Sensitive read audit. |
| `PATCH` | `/ob-ultrasounds/:id` | JWT | `ob_ultrasound.manage` | Owner, Doctor | Branch-scoped lookup before update. |
| `PATCH` | `/ob-ultrasounds/:id/review` | JWT | `ob_ultrasound.manage` | Owner, Doctor | Branch-scoped lookup before review. |
| `POST` | `/billing/invoices` | JWT | `billing.manage` | Owner, Accountant | TODO: fully enforce branch scope for referenced patient. |
| `GET` | `/billing/invoices` | JWT | `billing.read` | Owner, Accountant | Branch-scoped. Sensitive read audit. |
| `GET` | `/billing/invoices/:id` | JWT | `billing.read` | Owner, Accountant | Branch-scoped. Sensitive read audit. |
| `PATCH` | `/billing/invoices/:id` | JWT | `billing.manage` | Owner, Accountant | Branch-scoped lookup before update. |
| `POST` | `/billing/invoices/:id/issue` | JWT | `billing.manage` | Owner, Accountant | Branch-scoped lookup before issue. |
| `POST` | `/billing/payments` | JWT | `payment.manage` | Owner, Accountant, Receptionist if allowed | Branch-scoped invoice lookup before payment. |
| `GET` | `/billing/payments` | JWT | `billing.read` | Owner, Accountant | Branch-scoped. |
| `POST` | `/billing/payments/:id/reverse` | JWT | `billing.void` | Owner, Accountant | Branch-scoped payment lookup before reverse. |
| `GET` | `/dashboard/summary` | JWT | `dashboard.read` | Owner, Accountant currently | Branch-scoped aggregate counts. |
| `POST` | `/ai-drafts` | JWT | `ai_draft.request` | Owner, Doctor | Disabled/mock placeholder only. |
| `GET` | `/ai-drafts` | JWT | `ai_draft.read` | Owner, Doctor | Branch-scoped. Sensitive read audit. |
| `GET` | `/ai-drafts/:id` | JWT | `ai_draft.read` | Owner, Doctor | Branch-scoped. Sensitive read audit. |
| `PATCH` | `/ai-drafts/:id/review` | JWT | `ai_draft.review` | Owner, Doctor | Updates AI draft artifact only; no clinical record write. |

## Scope Rules Implemented

- Owner/Admin roles can see all local demo records.
- Non-owner/non-admin users are branch-scoped where the model has `branchId` or can be reached through `patient.branchId`.
- Doctor users are additionally limited to their own `doctorId` records for appointments, encounters, prescriptions, and investigation orders.
- Dashboard counts use the same branch scope for branch-bearing models.

## Current Scope Limitations

- Create endpoints still need fuller branch validation for all referenced records.
- Patient-to-doctor assignment is not modeled yet, so patient reads are branch-scoped but not doctor-assignment scoped.
- Receptionist and nurse read scopes are branch-based only.
- AI routes are disabled/mock-only; future AI approval/insertion workflows are intentionally not implemented.

## Expanded Test Coverage

The V0.1 pilot branch adds Node-based route-level security tests:

- `npm run test:routes:auth`
- `npm run test:scope:records`
- `npm run test:audit:assertions`
- `npm run test:ai:regression`
- `npm run test:security:expanded`

These tests cover every implemented protected API route with anonymous denial and owner access checks. Denied-role checks are included where a route has a clear lower-role denial case. Broad authenticated routes such as `/auth/me`, staff patient reads, and queue reads are documented warnings.

## Route Manifest Fields

The executable route inventory in `scripts/security-route-manifest.mjs` records the following for each protected route:

- Method and path.
- Whether authentication is required.
- Required permission.
- Allowed demo user, currently the seeded owner for full-route coverage.
- Denied demo user where a lower-role denial is meaningful.
- Expected status without token.
- Expected status with owner.
- Expected status with denied user.
- Safe demo-only request body for POST/PATCH checks.
- Scope expectation.
- Audit expectation.
- Current limitation or note.

Representative denied-role mappings used by the expanded runner:

| Route category | Allowed demo user | Denied demo user | Scope expectation | Audit expectation |
| --- | --- | --- | --- | --- |
| Auth broad routes | Owner | Warn only | Authenticated staff only | Login/logout audited where implemented |
| Admin users/roles/permissions | Owner | Accountant | Permission-scoped admin read | Admin read audit |
| Audit | Owner | Receptionist | Permission-scoped audit read | Audit read audit |
| Patients | Owner | Nurse for create/update; read routes warn | Branch-scoped reads for non-owner users | Patient create/read/update audit |
| Appointments | Owner | Nurse for manage routes; read routes warn | Branch and doctor scope where modeled | Create/status audit |
| Queue | Owner | Doctor for manage/status routes; read route warns | Branch-scoped queue records | Check-in/status audit |
| Encounters | Owner | Receptionist | Branch and doctor scope where modeled | Create/read/update/sign audit |
| Prescriptions | Owner | Receptionist | Branch and doctor scope where modeled | Create/read/update/sign audit |
| Investigations | Owner | Accountant | Branch and doctor scope where modeled | Create/status audit |
| Reports | Owner | Accountant | Branch-scoped report metadata | Create/read/update/review audit |
| Pregnancy | Owner | Accountant | Branch-scoped through patient/branch | Create/read/update audit |
| OB ultrasound | Owner | Accountant | Branch-scoped through patient/branch | Create/read/update/review audit |
| Billing | Owner | Doctor | Branch-scoped invoices/payments | Invoice/payment audit |
| Dashboard | Owner | Doctor | Branch-scoped aggregate counts | No detailed record audit expected |
| AI drafts | Owner | Nurse | Branch-scoped drafts | Placeholder create/read/review audit; no clinical insertion |
