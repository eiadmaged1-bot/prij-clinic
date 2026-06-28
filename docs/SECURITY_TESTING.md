# Security Testing

Date: 2026-06-28

These tests are local MVP safety checks for the demo foundation. They are not a production security certification and must not be run with real patient data, real payment data, real report files, real secrets, or external AI provider access.

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

## CI Status

GitHub Actions intentionally remains simple and stable:

```text
npm ci
npm run prisma:generate
npm run typecheck
npm run build
```

The security scripts require a live local API, web app, and database seed. They are documented as local security smoke tests and are not part of CI yet.

## Known Limits

- These scripts are deterministic smoke tests, not exhaustive authorization tests.
- Create/update referenced-record scope validation is still incomplete in the MVP.
- Patient-to-doctor assignment is not modeled yet.
- Audit tamper-resistance, retention, and export controls are not production-grade.
- AI remains disabled/mock-only. No external AI calls are allowed or tested.
