# Release Gate Checklist

Date: 2026-06-29

Use this checklist before merging release/staging branches and before any staging deployment. Passing this checklist does not approve real production patient use.

## Code and Build Gate

- [ ] `npm ci` completes.
- [ ] `npm run prisma:generate` completes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `git diff --check` passes.

## Database Gate

- [ ] Existing migrations are not deleted or edited.
- [ ] Staging/production path uses `npm run prisma:migrate:deploy`.
- [ ] `prisma migrate dev` is not used in staging or production.
- [ ] No database reset/drop command is run.
- [ ] Demo seed and production minimal seed behavior are understood from `docs/DATABASE_DEPLOYMENT_WORKFLOWS.md`.

## Security Gate

- [ ] `npm run test:security:ci` passes.
- [ ] `npm run test:security:expanded` passes.
- [ ] Admin and appearance APIs remain denied to non-admin users.
- [ ] RBAC, scope checks, audit behavior, consent boundaries, and AI safety checks are not weakened.
- [ ] No audit deletion or silent signed-record hard-delete path is introduced.

## Workflow Gate

- [ ] `npm run test:e2e:v01` passes.
- [ ] `npm run test:clinical:persistence` passes.
- [ ] Guided visit persistence works with fake/demo data.
- [ ] Patient timeline aggregation works with fake/demo data.
- [ ] OB/GYN workflow remains recording-only and non-diagnostic.
- [ ] Orders/reports remain metadata/demo placeholders without PHI uploads.
- [ ] Finance remains metadata-only with no real payment gateway.

## UI and Demo Gate

- [ ] `npm run test:theme:ui` passes.
- [ ] `npm run test:doctor:ux` passes.
- [ ] `npm run test:visual:qa` passes.
- [ ] Normal UI avoids visible stack traces, raw data pages, framework/database wording, and endpoint labels.
- [ ] Mobile/tablet demo check is acceptable using `docs/MOBILE_TABLET_QA.md`.

## Data and Secret Gate

- [ ] No `.env` or `apps/api/.env` staged.
- [ ] No secrets, API keys, passwords, tokens, private keys, uploads, logs, backups, local DB files, or `*.tsbuildinfo` staged.
- [ ] No real patient data in code, tests, screenshots, seeds, docs, uploads, or backups.
- [ ] Demo credentials are clearly blocked from production.
- [ ] Production env examples keep `SEED_DEMO_DATA=false` and `SEED_DEMO_OWNER=false`.

## External Integration Gate

- [ ] No external AI call is enabled.
- [ ] No AI provider key is present.
- [ ] No real payment gateway is enabled.
- [ ] No WhatsApp, insurance, inventory, or new production integration is added in this sprint.

## Documentation Gate

- [ ] Staging deployment runbook is current.
- [ ] Security hardening checklist is current.
- [ ] Backup/restore procedure is current.
- [ ] Operations monitoring plan is current.
- [ ] Known limitations and next steps clearly block real production patient use.
