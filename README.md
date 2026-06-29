# Prij Clinic

Clinic Management System V0.2 MVP pilot workflow lock for OB/GYN and women's health.

Current foundation includes hardened accounts/session/RBAC, audit logs, patients, consent records, appointments, queue, encounters, prescriptions, investigations, reports, pregnancy records, OB ultrasound records, billing, payments, dashboard summary, disabled AI draft placeholders, local backup helpers, and CI/security tests.

Current branch adds a local Clinical Guideline Center for owner/admin/doctor evidence-library workflows. It supports source registry metadata, private licensed upload storage, local text extraction/chunking, citation search, and mock/local RAG answers from indexed chunks only. It does not call external AI providers and does not modify clinical records.

V0.2 is a verified local/private MVP pilot workflow lock. It is not production-ready, not a medical device, and must not be used with real patient data.

The locked pilot flow is:

```text
Owner login -> patient file -> doctor workflow -> OB/GYN pregnancy workspace -> antenatal visit -> ultrasound report -> timeline -> print -> role-safe account behavior
```

## V0.1 Focused Clinic Workflow

The web app is now organized around the clinic workflow the pilot needs:

- Login with seeded demo credentials.
- Open Dashboard for a short operational overview.
- Open Patients.
- Create a New Patient File.
- Open the patient file and work from that patient-scoped workspace.
- Use module pages only for their focused workflow: appointments, queue, encounters, prescriptions, investigations, reports, pregnancy/ultrasound, billing, consents, and AI draft placeholders.
- Use Admin Control Center for local demo settings, staff/role visibility, service prices, safe overrides, system status, audit review, and appearance settings.
- Doctors can use Doctor Mode for a simpler daily workflow: open patient, start visit, write note, prescribe, order tests, finish, and move to the next patient.
- Patient files now use simplified tabs, large actions, and 3D-style medical icons for older-doctor-friendly recognition.

Every UI surface remains demo/local only: no real patient data, no real payment gateway, no production PHI upload, and no external AI calls.

Release-candidate verification and production-readiness planning are documented in:

- `docs/MVP_PILOT_WORKFLOW_LOCK_REPORT.md`
- `docs/MVP_RC_VERIFICATION_CHECKLIST.md`
- `docs/PRODUCTION_READINESS_PLAN.md`
- `docs/STAGING_DEPLOYMENT_RUNBOOK.md`
- `docs/SECURITY_HARDENING_CHECKLIST.md`
- `docs/RELEASE_GATE_CHECKLIST.md`
- `docs/OPERATIONS_MONITORING_PLAN.md`
- `docs/DATABASE_DEPLOYMENT_WORKFLOWS.md`
- `docs/VPS_STAGING_DEPLOYMENT_TRIAL.md`

## Safety Rules

- Do not use real patient data in development, tests, screenshots, seeds, or docs.
- Do not commit secrets, API keys, passwords, tokens, reports, backups, or patient data.
- AI external access is disabled. AI draft placeholders are metadata-only, disabled, and draft-only.
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
APP_ENV=local
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your-local-dev-secret
JWT_EXPIRES_IN=1h
DEMO_OWNER_EMAIL=owner@prij.local
DEMO_OWNER_PASSWORD=LocalDev123!
SEED_DEMO_OWNER=true
SEED_DEMO_DATA=true
```

Primary local demo admin login:

```text
Admin ID: eyad
Password: eyad
```

This credential is local demo only and is forbidden outside a local/private demo database.

Staging demo credentials must use different staging-only passwords. Production must set `SEED_DEMO_DATA=false` and `SEED_DEMO_OWNER=false`; production must not create `eyad` / `eyad`.

Other demo accounts are local-only and use the default password `LocalDev123!` unless overridden.

```text
Demo Owner:        demo.owner@prij.local       / LocalDev123!
Demo Doctor:       demo.doctor@prij.local      / LocalDev123!
Demo Reception:    demo.reception@prij.local   / LocalDev123!
Demo Accountant:   demo.accountant@prij.local  / LocalDev123!
Demo Nurse:        demo.nurse@prij.local       / LocalDev123!
```

Seed data uses only demo records such as `Demo Patient A`.

## Development

```powershell
npm run dev
```

Stop local dev ports:

```powershell
npm run dev:stop
```

Open:

```text
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/dashboard
http://localhost:3000/doctor
http://localhost:3000/doctor/visit
http://localhost:3000/admin
http://localhost:3000/patients
http://localhost:3000/patients/new
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
http://localhost:3000/consents
http://localhost:3000/ai-drafts
http://localhost:3000/guidelines
http://localhost:3000/guidelines/search
http://localhost:3000/guidelines/ask
http://localhost:3000/guidelines/upload
```

Recommended demo flow:

```text
Login -> Dashboard -> Patients -> New Patient File -> Save and open patient file -> patient file tabs -> appointment -> queue -> encounter -> prescription -> investigation -> pregnancy/ultrasound/report -> billing -> consent -> AI draft placeholder
```

Doctor-friendly demo flow:

```text
Login -> Doctor Mode -> Open Patient -> Start Visit -> Complaint -> History -> Examination -> Impression -> Prescription -> Orders -> Follow-up -> Finish Visit
```

Admin demo flow:

```text
Login as eyad -> Admin -> Accounts or Service Catalog and Prices -> create demo staff account or edit price -> Appearance -> choose theme -> review Audit Log Viewer
```

Safe admin overrides are reason-required and audited. The app supports void/cancel/archive style corrections only; audit logs and signed clinical records cannot be deleted from the normal UI.
The `eyad` account is the protected local demo System Owner. Normal UI/API flows cannot create a second System Owner, grant reserved System Owner permissions to another account, deactivate `eyad`, or demote `eyad`.

Theme and appearance controls:

1. Sign in as `eyad` / `eyad`.
2. Open `Admin`.
3. Open `Appearance`.
4. Choose Original Premium, Clinic Portal, Incision Portal, Minimal Clean, or Compact Operations.
5. Use `Use here` for this browser, or `Set as default` to save the local demo default.

The Admin and Appearance navigation is hidden for non-admin staff. The server also protects the appearance settings API with admin permissions, and setting changes are audited.

Patient file creation:

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000/login`.
3. Click `Use demo login`, then sign in.
4. Open `Patients`.
5. Click `New Patient File`.
6. Use fake/demo details only and click `Save and open patient file`.
7. Continue work from `/patients/:id`, where each tab is scoped to that patient where current APIs support it.

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
GET  /admin/accounts
POST /admin/accounts
PATCH /admin/accounts/:id
POST /admin/accounts/:id/reset-password
POST /admin/accounts/:id/deactivate
POST /admin/accounts/:id/activate
PATCH /admin/accounts/:id/permissions
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
npm run test:theme:ui
npm run test:doctor:ux
npm run test:e2e:v01
npm run test:clinical:persistence
npm run test:visual:qa
npm run test:accounts:rbac
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

The smoke test covers health, DB connectivity, login, anonymous rejection for a protected route, representative protected endpoints from each implemented module, AI disabled metadata, and the core web pages.

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

These are local demo safety checks for RBAC, branch scope, audit metadata, and disabled AI behavior. They are not production security certification tests and must not be run with real patient data.

For the CI-compatible API-only security integration runner, start the API after seeding and run:

```powershell
npm run test:security:ci
```

The runner uses `API_URL` when set, otherwise `http://localhost:3001`. It uses seeded demo credentials only and expects AI to remain disabled and draft-only.

Expanded route-level checks:

```powershell
npm run test:routes:auth
npm run test:scope:records
npm run test:audit:assertions
npm run test:ai:regression
npm run test:security:expanded
npm run test:admin:control
npm run test:theme:ui
npm run test:doctor:ux
npm run test:clinical:persistence
npm run test:visual:qa
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

Clinical persistence and release-candidate UI sweeps:

```powershell
npm run test:clinical:persistence
npm run test:visual:qa
```

`test:clinical:persistence` verifies fake/demo patient-context appointment, queue, guided visit persistence, prescription, investigation, report, OB/GYN, invoice/payment, consent, timeline, audit, and signed-encounter edit protection.

`test:visual:qa` verifies release-candidate pages are reachable, normal UI avoids obvious technical text, patient file and doctor pages are present, and admin appearance controls remain protected.

## Local Backup

```powershell
npm run backup:local
```

Backups are written under ignored `backups/`. Restore is guarded and documented in `docs/BACKUP_RESTORE.md`; do not run restore unless explicitly intended for a local/dev database.

## VPS Staging Trial

VPS staging must use fake/demo data only. Do not enter real patient data or PHI.

Prepared VPS docs/scripts:

- `docs/VPS_STAGING_DEPLOYMENT_TRIAL.md`
- `scripts/bootstrap-vps-staging.sh`
- `scripts/deploy-staging.sh`

Remote staging smoke test:

```bash
STAGING_BASE_URL=https://staging.example.invalid \
STAGING_API_URL=https://staging-api.example.invalid \
STAGING_DEMO_OWNER_LOGIN=demo.owner@prij.local \
STAGING_DEMO_OWNER_PASSWORD='<staging-demo-password>' \
STAGING_DEMO_TEST_PASSWORD='<staging-demo-password>' \
npm run test:staging:smoke
```

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
- `docs/MVP_RC_VERIFICATION_CHECKLIST.md`
- `docs/PRODUCTION_READINESS_PLAN.md`
- `docs/API_ENDPOINTS.md`
- `docs/RBAC_MATRIX.md`
- `docs/RBAC_AUDIT_REVIEW.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/NEXT_STEPS.md`
- `docs/DOCTOR_FRIENDLY_UX.md`
- `docs/BACKUP_RESTORE.md`
- `docs/FILE_STORAGE_SECURITY.md`
- `docs/DEPLOYMENT_READINESS.md`
- `docs/ENVIRONMENT_STRATEGY.md`
- `docs/VPS_STAGING_DEPLOYMENT_TRIAL.md`
