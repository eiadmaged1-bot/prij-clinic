# Current Status

Date: 2026-06-28

Branch: `release/v0.1-staging-demo`

Target tag: `v0.1-staging-demo-ready`

## Status Summary

The V0.1 staging/demo release candidate is a locally runnable, GitHub-backed, CI-tested demo/staging foundation. It is not production-ready and must not be used with real patient data, real payment data, PHI report files, real AI provider access, or live clinical workflows.

## Implemented Foundation

- Auth: local staff login, JWT cookie/bearer support, account lockout after repeated failures, logout audit.
- RBAC: seeded roles and permissions with server-side permission guards on protected controllers.
- Scope filtering: branch scope for non-owner/non-admin reads and referenced-record writes where supported; doctor scope for doctor-owned records where relevant.
- Audit: append-only audit table and metadata-only audit hooks for implemented create/update/status/sign/review/payment and sensitive read actions.
- MVP modules: patients, appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, payments, dashboard.
- Consent records: V0.1 structured consent foundation with auth/RBAC, branch-scoped patient references, audit metadata, and consent/privacy tests. Production legal text, signature capture, overrides, and full workflow blocking remain incomplete.
- AI draft review placeholder: disabled/mock-only draft artifact workflow with doctor-review statuses.
- V0.1 demo UI: usable local pages for login, dashboard, patients, consents, appointments/calendar, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, and AI drafts.
- V0.1 E2E workflow test: `npm run test:e2e:v01` creates fake/demo workflow records and checks representative audit metadata.
- Backup/restore foundation: local-only backup script with SHA256 sidecars, non-destructive backup verifier, guarded restore script, and backup/restore docs.
- Deployment readiness docs: environment strategy, local/CI/staging/production env examples, Docker/compose examples, staging guide, deployment requirements, and production blockers documented.
- Pilot QA package: role-by-role checklist, pilot demo guide, staging runbook, and manual-only staging deployment placeholder.
- Safe error/logging foundation: runtime env validation, safe error responses, error-safety test, logging/monitoring docs, and incident response foundation.
- CI: GitHub Actions runs install, Prisma client generation, typecheck, and build on `push` and `pull_request`.
- Security integration CI: GitHub Actions can run database-backed API security integration tests with PostgreSQL, existing Prisma migrations, demo seed data, and disabled/mock-only AI settings.
- Smoke test: `npm run smoke:test` checks health, DB connectivity, login, anonymous denial, protected API routes, AI disabled/mock metadata, and core web pages.
- Security tests: local scripts cover representative RBAC denial/allow paths, branch scope behavior, audit creation and metadata minimization, and AI disabled/mock safety.
- CI security test: `npm run test:security:ci` covers API health, database health, seeded owner login, anonymous denial, representative protected endpoints, and disabled/mock-only AI draft safety.
- Expanded route security tests: `npm run test:security:expanded` covers the executable route manifest, representative denied-role checks, out-of-branch referenced-record write denial assertions, audit assertions, consent/privacy checks, error-safety checks, and AI safety regression.
- Role permission matrix: `docs/ROLE_PERMISSION_MATRIX.md` documents seeded Owner/Admin/Doctor/Nurse/Receptionist/Accountant behavior and lower-role denial expectations.

## Safety State

- Seed data uses demo-only records such as `Demo Patient A` and `Demo Patient B`.
- No real AI API calls or provider SDK usage are implemented.
- AI draft artifacts are marked `disabled_mock` / `no_external_ai`.
- AI draft review cannot update final clinical records.
- OB ultrasound fields do not calculate diagnoses or trigger fetal-image analysis.

## Local Verification

Recommended full local sequence:

```powershell
npm run dev:stop
npm run prisma:repair
npm run prisma:seed
npm run demo:reset
npm run typecheck
npm run build
```

Then start API and web:

```powershell
npm run dev:api
npm run dev:web
npm run smoke:test
npm run test:security
```

API-only security integration check:

```powershell
npm run test:security:ci
npm run test:security:expanded
npm run test:consent:privacy
npm run test:error:safety
npm run test:e2e:v01
```

## Commit Safety

Before commit, ensure these are not staged:

- `.env`
- `apps/api/.env`
- Any `*.tsbuildinfo`
- Logs
- Uploads
- Local database files
- Secrets, API keys, tokens, or patient data
