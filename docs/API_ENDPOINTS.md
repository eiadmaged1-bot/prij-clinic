# API Endpoints

Base URL in local development: `http://localhost:3001`

## Public Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Process health check. |
| `GET` | `/health/db` | Database connectivity check. |
| `POST` | `/auth/login` | Staff login. Audits success and failure. |

## Auth Endpoints

| Method | Path | Permission | Notes |
| --- | --- | --- | --- |
| `GET` | `/auth/me` | JWT required | Returns current safe user, roles, and permissions. |
| `POST` | `/auth/logout` | JWT required | Clears cookie and audits logout. |

## Admin And Audit

| Method | Path | Permission |
| --- | --- | --- |
| `GET` | `/admin/users` | `user.read` |
| `GET` | `/admin/roles` | `role.read` |
| `GET` | `/admin/permissions` | `permission.read` |
| `GET` | `/audit` | `audit.read` |

## Workflow Endpoints

| Method | Path | Permission |
| --- | --- | --- |
| `POST` | `/patients` | `patients.manage` |
| `GET` | `/patients` | `patients.read` |
| `GET` | `/patients/:id` | `patients.read` |
| `PATCH` | `/patients/:id` | `patients.manage` |
| `POST` | `/appointments` | `appointments.manage` |
| `GET` | `/appointments` | `appointments.read` |
| `GET` | `/appointments/calendar` | `appointments.read` |
| `GET` | `/appointments/:id` | `appointments.read` |
| `PATCH` | `/appointments/:id/status` | `appointments.manage` |
| `POST` | `/queue/check-in` | `queue.manage` |
| `GET` | `/queue/today` | `queue.read` |
| `PATCH` | `/queue/:id/call` | `queue.manage` |
| `PATCH` | `/queue/:id/complete` | `queue.manage` |
| `PATCH` | `/queue/:id/cancel` | `queue.manage` |
| `POST` | `/encounters` | `encounters.manage` |
| `GET` | `/encounters` | `encounters.read` |
| `GET` | `/encounters/:id` | `encounters.read` |
| `PATCH` | `/encounters/:id` | `encounters.manage` |
| `PATCH` | `/encounters/:id/sign` | `encounters.manage` |
| `POST` | `/prescriptions` | `prescriptions.manage` |
| `GET` | `/prescriptions` | `prescriptions.read` |
| `GET` | `/prescriptions/:id` | `prescriptions.read` |
| `PATCH` | `/prescriptions/:id` | `prescriptions.manage` |
| `PATCH` | `/prescriptions/:id/sign` | `prescriptions.manage` |
| `POST` | `/investigations/orders` | `investigations.manage` |
| `GET` | `/investigations/orders` | `investigations.read` |
| `GET` | `/investigations/orders/:id` | `investigations.read` |
| `PATCH` | `/investigations/orders/:id/status` | `investigations.manage` |
| `POST` | `/reports` | `reports.manage` |
| `GET` | `/reports` | `reports.read` |
| `GET` | `/reports/:id` | `reports.read` |
| `PATCH` | `/reports/:id` | `reports.manage` |
| `PATCH` | `/reports/:id/review` | `reports.manage` |
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

## AI Draft Placeholder Endpoints

| Method | Path | Permission | Safety Boundary |
| --- | --- | --- | --- |
| `POST` | `/ai-drafts` | `ai_draft.request` | Creates disabled/mock placeholder text only. |
| `GET` | `/ai-drafts` | `ai_draft.read` | Lists draft artifacts. |
| `GET` | `/ai-drafts/:id` | `ai_draft.read` | Returns a draft artifact. |
| `PATCH` | `/ai-drafts/:id/review` | `ai_draft.review` | Updates draft review status only. Does not update clinical records. |

AI draft responses must remain marked with `modelProvider: disabled_mock` and `modelName: no_external_ai` until a separate approved AI integration sprint.
