# API Endpoints

Base URL in local development: `http://localhost:3001`

The MVP API is a local demo foundation. It is not production-ready and must not be used with real patient data, real payment data, report files containing PHI, or real AI provider access.

## Public Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Process health check. |
| `GET` | `/health/db` | Database connectivity check. |
| `POST` | `/auth/login` | Staff login. Audits success and failure. |

## Protected Endpoints

All endpoints below require JWT authentication. Permission names match the implemented controller guards.

| Method | Path | Permission |
| --- | --- | --- |
| `GET` | `/auth/me` | Authenticated user |
| `POST` | `/auth/logout` | Authenticated user |
| `GET` | `/admin/users` | `user.read` |
| `GET` | `/admin/roles` | `role.read` |
| `GET` | `/admin/permissions` | `permission.read` |
| `GET` | `/audit` | `audit.read` |
| `POST` | `/patients` | `patient.create` |
| `GET` | `/patients` | `patient.read` |
| `GET` | `/patients/:id` | `patient.read` |
| `PATCH` | `/patients/:id` | `patient.update` |
| `POST` | `/consents` | `patient.consent_manage` |
| `GET` | `/consents?patientId=:id` | `patient.consent_read` |
| `POST` | `/appointments` | `appointment.manage` |
| `GET` | `/appointments` | `appointment.read` |
| `GET` | `/appointments/calendar` | `appointment.read` |
| `GET` | `/appointments/:id` | `appointment.read` |
| `PATCH` | `/appointments/:id/status` | `appointment.manage` |
| `POST` | `/queue/check-in` | `queue.manage` |
| `GET` | `/queue/today` | `queue.read` |
| `PATCH` | `/queue/:id/call` | `queue.status_update` |
| `PATCH` | `/queue/:id/complete` | `queue.status_update` |
| `PATCH` | `/queue/:id/cancel` | `queue.status_update` |
| `POST` | `/encounters` | `encounter.create` |
| `GET` | `/encounters` | `encounter.read` |
| `GET` | `/encounters/:id` | `encounter.read` |
| `PATCH` | `/encounters/:id` | `encounter.update_own` |
| `PATCH` | `/encounters/:id/sign` | `encounter.sign` |
| `POST` | `/prescriptions` | `prescription.create` |
| `GET` | `/prescriptions` | `prescription.read` |
| `GET` | `/prescriptions/:id` | `prescription.read` |
| `PATCH` | `/prescriptions/:id` | `prescription.update` |
| `PATCH` | `/prescriptions/:id/sign` | `prescription.approve` |
| `POST` | `/investigations/orders` | `investigation.create` |
| `GET` | `/investigations/orders` | `investigation.read` |
| `GET` | `/investigations/orders/:id` | `investigation.read` |
| `PATCH` | `/investigations/orders/:id/status` | `investigation.update` |
| `POST` | `/reports` | `report.upload` |
| `GET` | `/reports` | `report.read` |
| `GET` | `/reports/:id` | `report.read` |
| `PATCH` | `/reports/:id` | `report.update` |
| `PATCH` | `/reports/:id/review` | `report.review` |
| `POST` | `/pregnancies` | `pregnancy.manage` |
| `GET` | `/pregnancies` | `pregnancy.read` |
| `GET` | `/pregnancies/:id` | `pregnancy.read` |
| `PATCH` | `/pregnancies/:id` | `pregnancy.manage` |
| `POST` | `/ob-ultrasounds` | `ob_ultrasound.manage` |
| `GET` | `/ob-ultrasounds` | `ob_ultrasound.read` |
| `GET` | `/ob-ultrasounds/:id` | `ob_ultrasound.read` |
| `PATCH` | `/ob-ultrasounds/:id` | `ob_ultrasound.manage` |
| `PATCH` | `/ob-ultrasounds/:id/review` | `ob_ultrasound.manage` |
| `POST` | `/billing/invoices` | `billing.manage` |
| `GET` | `/billing/invoices` | `billing.read` |
| `GET` | `/billing/invoices/:id` | `billing.read` |
| `PATCH` | `/billing/invoices/:id` | `billing.manage` |
| `POST` | `/billing/invoices/:id/issue` | `billing.manage` |
| `POST` | `/billing/payments` | `payment.manage` |
| `GET` | `/billing/payments` | `billing.read` |
| `POST` | `/billing/payments/:id/reverse` | `billing.void` |
| `GET` | `/dashboard/summary` | `dashboard.read` |
| `POST` | `/ai-drafts` | `ai_draft.request` |
| `GET` | `/ai-drafts` | `ai_draft.read` |
| `GET` | `/ai-drafts/:id` | `ai_draft.read` |
| `PATCH` | `/ai-drafts/:id/review` | `ai_draft.review` |

## Safety Notes

- The actual implemented OB ultrasound API route is `/ob-ultrasounds`.
- The actual implemented AI draft API route is `/ai-drafts`.
- AI draft responses must remain marked with `modelProvider: disabled_mock` and `modelName: no_external_ai`.
- AI draft review updates only the AI draft artifact and audit metadata; it does not update final clinical records.
- Consent endpoints are V0.1 foundation only. They store structured demo-safe consent records and audit metadata, but production legal text, signature capture, and full workflow enforcement are not implemented.

## Automated Route Coverage

Route-level authorization coverage is tracked in `scripts/security-route-manifest.mjs` and executed with:

```powershell
npm run test:routes:auth
```

The expanded test suite checks anonymous rejection, owner access, and representative denied-role behavior for protected route categories. Some authenticated read routes are intentionally broad across staff roles and are reported as documented warnings rather than failures.

For every protected route, the manifest records method, path, required permission, allowed and denied demo users, expected statuses, scope expectation, audit expectation, and current limitations. The route inventory is executable so documentation and tests stay aligned.
