# Security Testing

Date: 2026-06-28

These tests are MVP safety checks for the demo foundation. They are not a production security certification and must not be run with real patient data, real payment data, real report files, real secrets, or external AI provider access.

## Prerequisites

Start from the repository root:

```powershell
npm run dev:stop
npm run prisma:repair
npm run prisma:seed
npm run typecheck
npm run build
```

Then start the API and web apps:

```powershell
npm run dev:api
npm run dev:web
```

## Commands

```powershell
npm run smoke:test
npm run test:rbac
npm run test:scope
npm run test:audit
npm run test:ai-safety
npm run test:security
```

`npm run test:security` runs all security scripts after the live API and web apps are available.

## CI-Compatible Integration Runner

The cross-platform API-only runner is:

```powershell
npm run test:security:ci
```

It uses `API_URL` when set, otherwise `http://localhost:3001`. It waits for `GET /health`, checks `GET /health/db`, logs in with the seeded demo owner account, confirms a protected route rejects anonymous access, exercises representative protected API endpoints, and verifies AI remains disabled/mock-only.

The runner intentionally does not start the web app, does not use real patient data, does not call external AI providers, does not reset the database, and does not create final clinical records. It may create safe demo-only AI draft artifacts to prove those drafts cannot sign or insert final clinical records.

## Demo Test Accounts

The seed creates deterministic demo-only accounts:

| Email | Role | Branch |
| --- | --- | --- |
| `demo.owner@prij.local` | Owner | Demo Branch A |
| `demo.doctor@prij.local` | Doctor | Demo Branch A |
| `demo.reception@prij.local` | Receptionist | Demo Branch A |
| `demo.accountant@prij.local` | Accountant | Demo Branch A |
| `demo.nurse@prij.local` | Nurse | Demo Branch B |

The local demo password follows the README pattern and defaults to `LocalDev123!`. This is local-only demo data, not a production credential pattern.

## Coverage

- `scripts/rbac-test.ps1`: verifies anonymous denial, owner access, representative lower-role denials, and representative lower-role allowed access.
- `scripts/scope-test.ps1`: verifies the seeded two-branch patient fixtures and confirms a branch-B nurse cannot read branch-A patient records through list/detail APIs. It also checks doctor appointment counts do not exceed owner-visible counts.
- `scripts/audit-test.ps1`: performs safe demo patient and encounter writes, verifies audit entries are created, and checks a sentinel raw body string is not stored in audit output.
- `scripts/ai-safety-test.ps1`: verifies AI is disabled/mock-only, AI draft metadata stays disabled, lower-role review is denied, no sign/insert AI routes exist, and AI review audit metadata records no clinical insertion.
- `scripts/security-test-all.ps1`: runs smoke, RBAC, scope, audit, and AI safety scripts.
- `scripts/security-integration-test.mjs`: verifies CI-friendly API health, database health, seeded owner login, anonymous denial, representative protected endpoints, and disabled/mock-only AI safety boundaries.

## CI Status

GitHub Actions has two workflows:

- `CI`: simple install, Prisma generate, typecheck, and build.
- `Security Integration Tests`: PostgreSQL-backed API integration checks for seeded demo data and security smoke coverage.

The security integration workflow runs:

```text
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run typecheck
npm run build
npm run start -w apps/api
npm run test:security:ci
```

It uses PostgreSQL 16 in a GitHub Actions service container and keeps AI disabled with `AI_FEATURES_ENABLED=false` and `AI_PROVIDER=disabled`.

## Known Limits

- These scripts are deterministic smoke tests, not exhaustive authorization tests.
- CI integration coverage is API-only and does not run browser checks or the Next.js web app.
- Create/update referenced-record scope validation is still incomplete in the MVP.
- Patient-to-doctor assignment is not modeled yet.
- Audit tamper-resistance, retention, and export controls are not production-grade.
- AI remains disabled/mock-only. No external AI calls are allowed or tested.
