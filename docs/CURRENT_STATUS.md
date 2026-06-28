# Current Status

Date: 2026-06-28

Branch: `hardening/mvp-foundation-review`

Baseline tag: `mvp-foundation-complete`

## Review Scope

This is a hardening and review sprint only. No new product features, clinical modules, database schema changes, migrations, or external AI integrations are included in this sprint.

## Implemented Foundation

- Auth: local staff login, JWT cookie/bearer support, account lockout after repeated failures, logout audit.
- RBAC: role and permission seed foundation, server-side permission guards on protected controllers.
- Audit: append-only audit log table and audit hooks for implemented create/update/status/review/payment actions.
- MVP workflow modules: patients, appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, dashboard.
- AI draft review placeholder: disabled/mock-only draft artifact workflow with doctor-review statuses.

## Verification Summary

Required command sequence for this branch:

```powershell
npm run dev:stop
npm run prisma:repair
npm run prisma:seed
npm run typecheck
npm run build
```

Smoke-test command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke-test.ps1
```

The smoke test checks health, database connectivity, login, anonymous denial for a protected route, representative protected endpoints from every module, AI disabled/mock metadata, and core web pages.

## Safety State

- Seed data uses demo-only records: `Demo Patient A`, `Demo Patient B`, local demo report, local demo billing, and local disabled AI draft placeholder.
- No committed real patient data was found in the reviewed seed/docs.
- No committed external AI API calls or provider SDK usage was found.
- AI draft artifacts are marked `disabled_mock` / `no_external_ai`.
- AI draft review updates only the AI draft artifact and records audit metadata with `insertedIntoClinicalRecord: false`.
- OB ultrasound fields are stored as clinical record data only. The current code does not calculate diagnoses such as FGR or trigger automatic fetal-image analysis.

## Working Tree Rules

Before commit, ensure these are not staged:

- `.env`
- `apps/api/.env`
- `apps/web/tsconfig.tsbuildinfo`
- Any other `*.tsbuildinfo`
