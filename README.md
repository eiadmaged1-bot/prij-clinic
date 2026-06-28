# Prij Clinic

Clinic Management System V0.1 release-candidate foundation for OB/GYN and women's health.

Current foundation includes auth, RBAC, audit logs, patients, consent records, appointments, queue, encounters, prescriptions, investigations, reports, pregnancy records, OB ultrasound records, billing, payments, dashboard summary, disabled AI draft placeholders, local backup verification, environment separation, safe error responses, deployment examples, and CI/security tests.

V0.1 is a local/private release-candidate foundation for controlled demo and staging QA. It is not production-ready and is not a medical device.

## Safety Rules

- Do not use real patient data in development, tests, screenshots, seeds, or docs.
- Do not commit secrets, API keys, passwords, tokens, reports, backups, or patient data.
- AI external access is disabled. AI draft placeholders are metadata-only and mock/disabled.
- AI cannot diagnose, prescribe, sign records, approve clinical records, override RBAC, or bypass doctor approval.
- Clinical output must remain doctor-authored or doctor-reviewed before use.
- Clinical writes, billing changes, report review, and AI draft review placeholders are audit logged.
- OB ultrasound records do not automatically diagnose FGR or any other condition.

## Stack

- Monorepo with npm workspaces
- `apps/web`: Next.js frontend
- `apps/api`: NestJS API
- PostgreSQL via Docker Compose
- Prisma ORM in `apps/api`

## Local Setup

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d postgres
npm run prisma:repair
npm run prisma:seed
```

Edit `.env` locally. Use real local values only in `.env`, never in `.env.example`.

Required local variables:

```powershell
API_PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your-local-dev-secret
JWT_EXPIRES_IN=1h
DEMO_OWNER_EMAIL=owner@prij.local
DEMO_OWNER_PASSWORD=LocalDev123!
SEED_DEMO_OWNER=true
```

Tracked environment templates:

```text
.env.example
.env.ci.example
.env.staging.example
.env.production.example
```

Real environment files stay ignored. Production values must come from a secret manager or deployment platform.

Demo accounts are local-only and use the default password `LocalDev123!` unless overridden:

```text
demo.owner@prij.local
demo.doctor@prij.local
demo.reception@prij.local
demo.accountant@prij.local
demo.nurse@prij.local
```

Seed data uses only demo records such as `Demo Patient A`.

## Development

```powershell
npm run dev:api
npm run dev:web
```

Open:

```text
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/dashboard
http://localhost:3000/patients
http://localhost:3000/appointments
http://localhost:3000/calendar
http://localhost:3000/queue
http://localhost:3000/encounters
http://localhost:3000/prescriptions
http://localhost:3000/investigations
http://localhost:3000/reports
http://localhost:3000/pregnancies
http://localhost:3000/ultrasound
http://localhost:3000/billing
http://localhost:3000/ai-drafts
```

## Current Endpoints

Health:

```text
GET /health
GET /health/db
```

Auth/admin/audit:

```text
POST /auth/login
GET  /auth/me
POST /auth/logout
GET  /admin/users
GET  /admin/roles
GET  /admin/permissions
GET  /audit
```

MVP workflows:

```text
GET  /patients
GET  /consents?patientId=:id
POST /consents
GET  /appointments
GET  /appointments/calendar
GET  /queue/today
GET  /encounters
GET  /prescriptions
GET  /investigations/orders
GET  /reports
GET  /pregnancies
GET  /ob-ultrasounds
GET  /billing/invoices
GET  /billing/payments
GET  /dashboard/summary
GET  /ai-drafts
```

## Verification

```powershell
npm run prisma:repair
npm run prisma:seed
npm run typecheck
npm run build
```

## CI

GitHub Actions runs basic CI on `push` and `pull_request` using Node.js 22:

```text
npm ci
npm run prisma:generate
npm run typecheck
npm run build
```

Full local V0.1 check, after starting API and web:

```powershell
npm run smoke:test
npm run test:security
npm run test:security:ci
npm run test:security:expanded
npm run test:e2e:v01
```

Security integration CI is handled by a separate workflow, `Security Integration Tests`, on `workflow_dispatch`, `pull_request`, and pushes to `security/**`, `tests/**`, `ci/**`, and `auto/**`.

That workflow starts a PostgreSQL 16 service container, applies existing Prisma migrations with `npm run prisma:migrate:deploy`, seeds demo-only data, starts the API, and runs:

```text
npm run test:security:ci
```

The CI security runner is API-only. It does not start the Next.js web app, does not use real patient data, does not call external AI providers, and does not certify production readiness.

The same workflow also runs the expanded route-level security suite:

```text
npm run test:security:expanded
```

That suite uses `scripts/security-route-manifest.mjs` as the executable route inventory for protected API routes, including expected owner access, anonymous denial, representative denied-role checks, scope expectations, audit expectations, and documented warnings.

## Smoke Test

Start the API and web app, then run:

```powershell
npm run smoke:test
```

The smoke test covers health, DB connectivity, login, anonymous rejection for a protected route, representative protected endpoints from each implemented module, AI disabled/mock metadata, and the core web pages.

To run API-only checks:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke-test.ps1 -SkipWeb
```

The actual implemented OB ultrasound endpoint is `GET /ob-ultrasounds`; the actual implemented AI draft endpoint is `GET /ai-drafts`.

## Security Tests

After `npm run prisma:seed` and with the API/web apps running locally:

```powershell
npm run test:rbac
npm run test:scope
npm run test:audit
npm run test:ai-safety
npm run test:security
```

These are local demo safety checks for RBAC, branch scope, audit metadata, and disabled/mock AI behavior. They are not production security certification tests and must not be run with real patient data.

For the CI-compatible API-only security integration runner, start the API after seeding and run:

```powershell
npm run test:security:ci
```

The runner uses `API_URL` when set, otherwise `http://localhost:3001`. It uses seeded demo credentials only and expects AI to remain disabled/mock-only.

Expanded route-level checks:

```powershell
npm run test:routes:auth
npm run test:scope:records
npm run test:audit:assertions
npm run test:consent:privacy
npm run test:error:safety
npm run test:ai:regression
npm run test:security:expanded
```

Current hardening matrices:

- `docs/RBAC_MATRIX.md`
- `docs/ROLE_PERMISSION_MATRIX.md`
- `docs/REFERENCED_RECORD_SCOPE_MATRIX.md`
- `docs/RBAC_AUDIT_REVIEW.md`

See `docs/SECURITY_TESTING.md`.

## V0.1 Workflow Test

With the API running against seeded local data:

```powershell
npm run test:e2e:v01
```

This creates demo-only records for the V0.1 workflow and verifies representative audit metadata. It does not use real patient data, real clinical histories, real payment data, real report files, or external AI calls.

## Local Backup

```powershell
npm run backup:local
npm run backup:verify -- -BackupFile backups/prij-clinic-local-YYYYMMDD-HHMMSS.sql
```

Backups are written under ignored `backups/`. Restore is guarded and documented in `docs/BACKUP_RESTORE.md`; do not run restore unless explicitly intended for a local/dev database.

## Release Readiness Docs

- `docs/CONSENT_PRIVACY.md`
- `docs/FILE_STORAGE_SECURITY.md`
- `docs/BACKUP_RESTORE.md`
- `docs/ENVIRONMENT_STRATEGY.md`
- `docs/DEPLOYMENT_READINESS.md`
- `docs/STAGING_DEPLOYMENT.md`
- `docs/LOGGING_MONITORING.md`
- `docs/INCIDENT_RESPONSE.md`

Authenticated smoke checks use the local demo owner:

```powershell
$body = @{
  email = "owner@prij.local"
  password = "LocalDev123!"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3001/auth/login" `
  -ContentType "application/json" `
  -Body $body

$headers = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod "http://localhost:3001/auth/me" -Headers $headers
Invoke-RestMethod "http://localhost:3001/reports" -Headers $headers
Invoke-RestMethod "http://localhost:3001/pregnancies" -Headers $headers
Invoke-RestMethod "http://localhost:3001/ob-ultrasounds" -Headers $headers
Invoke-RestMethod "http://localhost:3001/billing/invoices" -Headers $headers
Invoke-RestMethod "http://localhost:3001/ai-drafts" -Headers $headers
```

## Prisma Workflow

Use the repository-root wrappers:

```powershell
npm run dev:stop
npm run prisma:migrate:local -- migration_name
npm run prisma:repair
npm run prisma:seed
```

Stop immediately if Prisma asks to reset the database or if a command would delete data or migrations.

## Status Documents

- `docs/CURRENT_STATUS.md`
- `docs/V0_1_RELEASE_NOTES.md`
- `docs/API_ENDPOINTS.md`
- `docs/RBAC_MATRIX.md`
- `docs/RBAC_AUDIT_REVIEW.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/NEXT_STEPS.md`
- `docs/BACKUP_RESTORE.md`
- `docs/FILE_STORAGE_SECURITY.md`
- `docs/DEPLOYMENT_READINESS.md`
- `docs/ENVIRONMENT_STRATEGY.md`
