# Current Status

Date: 2026-06-28

## Completed

- Sprint 3 committed: `496b273 Add encounters prescriptions and investigation orders foundation`
- Sprint 4 committed: `727a0d8 Add reports and OB ultrasound foundation`
- Sprint 5 committed: `e500c60 Add billing payments and dashboard foundation`
- Sprint 6 committed: `c55d4c9 Add AI draft review placeholder foundation`

## Current Scope

- Auth, RBAC, audit logs, users, roles, permissions, and branch foundation.
- Patients, appointments, queue, doctor calendar, encounters, prescriptions, investigations, reports, pregnancies, and OB ultrasound records.
- Billing invoices, invoice items, payment records, payment reversal placeholder, and dashboard summary.
- AI draft placeholder records with disabled/mock metadata only.

## Safety State

- Seed data uses demo records only.
- No real patient data should be stored in the repository.
- `.env` and `apps/api/.env` must stay uncommitted.
- `apps/web/tsconfig.tsbuildinfo` is generated local state and should not be committed.
- AI external provider access is disabled. Current AI draft rows use `disabled_mock` and `no_external_ai`.
- AI draft review updates only the draft artifact. It does not insert into clinical records, diagnose, prescribe, sign, or bypass RBAC.

## Latest Checks

Passed:

- `npm run prisma:repair`
- `npm run prisma:seed`
- `npm run typecheck`
- `npm run build`

Smoke checked:

- `GET /health`
- `GET /health/db`
- `POST /auth/login`
- `GET /auth/me`
- `GET /reports`
- `GET /pregnancies`
- `GET /ob-ultrasounds`
- `GET /billing/invoices`
- `GET /billing/payments`
- `GET /dashboard/summary`
- `GET /ai-drafts`

Browser page checks returned HTTP 200:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/reports`
- `http://localhost:3000/pregnancies`
- `http://localhost:3000/ultrasound`
- `http://localhost:3000/billing`
- `http://localhost:3000/ai-drafts`

## Next Work

- Broaden patient profile timeline and workflow-specific detail views.
- Add focused tests for billing rollups, AI draft review status transitions, and audit log writes.
- Design backup/restore-test operational workflow before production use.
