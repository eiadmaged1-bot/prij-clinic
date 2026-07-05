# Pilot Runbook

This runbook is for controlled pilot release-candidate verification with fake/demo data only. It does not authorize production use or real patient data.

## Environment

- Use approved local or staging configuration only.
- Keep secrets in uncommitted environment files.
- Keep external AI disabled by default.
- Use fake/demo data only.
- Do not reset, drop, or volume-delete the database during release checks.

## Startup

```powershell
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run dev
```

If PostgreSQL is not running locally:

```powershell
docker compose up -d postgres
npm run prisma:repair
npm run prisma:seed
npm run dev
```

## Staging Simulation

```powershell
npm run staging:simulate
npm run test:v180:staging-smoke
npm run test:v180:backup-staging-readiness
npm run test:v181:browser-qa-lock
```

## Backup Readiness

```powershell
npm run test:v180:backup-staging-readiness
npm run test:v160:security-real-data-readiness
```

Backup files must remain outside git under ignored backup locations.

## Manual QA Path

Use `docs/PILOT_QA_CHECKLIST.md`, `docs/ROLE_BY_ROLE_BROWSER_QA.md`, and `docs/STAGING_BROWSER_QA_CHECKLIST.md`.

Real patient data remains prohibited until legal/privacy, backup/restore, deployment, and role-by-role signoff are complete.
