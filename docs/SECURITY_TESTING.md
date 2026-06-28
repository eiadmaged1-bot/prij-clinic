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
npm run test:e2e:v01
npm run test:consent:privacy
npm run test:error:safety
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
- `scripts/security-route-manifest.mjs`: executable route inventory for implemented protected API routes. Each case includes name, method, path, auth requirement, permission, allowed demo user, denied demo user where applicable, expected statuses, safe demo body, scope expectation, audit expectation, and notes/limitations.
- `scripts/route-authorization-test.mjs`: checks anonymous denial, owner access, and representative denied-role behavior across implemented routes.
- `scripts/referenced-scope-test.mjs`: checks seeded branch scope behavior and verifies out-of-branch referenced-record create attempts fail safely for appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, consents, and AI drafts.
- `scripts/audit-assertion-test.mjs`: checks representative audit events for patient, appointment, queue, encounter, prescription, investigation, report, pregnancy, OB ultrasound, invoice, payment, consent, and AI draft actions, and confirms audit output does not expose bearer tokens or credential material.
- `scripts/consent-privacy-test.mjs`: checks consent routes require auth, demo consent create/read works, lower-role access is denied, out-of-branch patient references fail safely, and consent audit metadata avoids credential material.
- `scripts/error-safety-test.mjs`: checks representative error responses do not expose stack traces, database URLs, JWT secret names/values, bearer tokens, password hashes, or password-like input.
- `scripts/ai-safety-regression-test.mjs`: checks AI remains disabled/mock-only, routes require auth, lower-role review is denied, prompt-like input is not executed, no final-record AI routes exist, no external provider access is recorded, and AI cannot sign, insert, diagnose, or prescribe.
- `scripts/security-test-expanded.mjs`: runs the expanded Node security test set.
- `scripts/security-test-all.mjs`: canonical expanded aggregate runner used by `npm run test:security:expanded`.
- `scripts/e2e-v01-workflow-test.mjs`: demo-only V0.1 workflow test that creates fake patient, consent, appointment, queue, encounter, prescription, investigation, pregnancy, OB ultrasound, report, invoice, payment, and disabled/mock AI draft records.

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
npm run test:security:expanded
```

It uses PostgreSQL 16 in a GitHub Actions service container and keeps AI disabled with `AI_FEATURES_ENABLED=false` and `AI_PROVIDER=disabled`.

## Known Limits

- These scripts are deterministic security smoke/integration tests, not production authorization certification.
- CI integration coverage is API-only and does not run browser checks or the Next.js web app.
- Some routes are intentionally broad authenticated routes and emit WARN rather than FAIL for missing denied-role cases: `/auth/me`, `/auth/logout`, scoped patient reads, appointment reads, calendar reads, and queue reads.
- Referenced-record create/write scope is hardened for implemented MVP routes, but patient-to-doctor assignment and exhaustive future state-transition policy remain incomplete.
- Consent records are covered as a V0.1 foundation, but production legal consent text, signature capture, override workflow, and full consent enforcement are not implemented.
- Error-safety checks cover representative API errors only; production log aggregation and alerting remain future work.
- Patient-to-doctor assignment is not modeled yet.
- Local backup scripts are operational helpers only, not production backup certification.
- Audit tamper-resistance, retention, and export controls are not production-grade.
- AI remains disabled/mock-only. No external AI calls are allowed or tested.

## Security Matrices

- Route inventory: `docs/API_ENDPOINTS.md` and `scripts/security-route-manifest.mjs`.
- RBAC route matrix: `docs/RBAC_MATRIX.md`.
- Lower-role permission matrix: `docs/ROLE_PERMISSION_MATRIX.md`.
- Referenced-record scope matrix: `docs/REFERENCED_RECORD_SCOPE_MATRIX.md`.
- Audit review: `docs/RBAC_AUDIT_REVIEW.md`.
