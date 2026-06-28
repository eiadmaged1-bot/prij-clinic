# Pilot Demo Guide

Date: 2026-06-28

This guide is for controlled V0.1 local or staging demos with synthetic data only. It is not production approval and must not be used with real patients, PHI files, payment credentials, or external AI providers.

## Demo Safety Rules

- Use seeded demo users and synthetic demo records only.
- Do not upload real report files or screenshots containing real patient data.
- Do not enter card numbers, payment tokens, addresses, phone numbers, or real clinical histories.
- Keep `AI_FEATURES_ENABLED=false` and `AI_PROVIDER=disabled`.
- Treat AI draft screens as disabled/mock placeholders only.
- OB ultrasound records are manual demo records and do not diagnose FGR or any condition.

## Local Demo Setup

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d postgres
npm run demo:reset
npm run dev:api
npm run dev:web
```

Open `http://localhost:3000`.

If you do not want to stop/reseed local demo processes, use:

```powershell
npm run prisma:repair
npm run prisma:seed
```

## Demo Accounts

Default password: `LocalDev123!`

```text
demo.owner@prij.local
demo.doctor@prij.local
demo.reception@prij.local
demo.accountant@prij.local
demo.nurse@prij.local
```

## Browser Workflow

1. Login at `/login`.
2. Open `/dashboard`.
3. Register a synthetic patient at `/patients/new`.
4. Record consent at `/consents`.
5. Schedule appointment at `/appointments`.
6. Check in queue at `/queue`.
7. Open clinical workflow at `/encounters`.
8. Review prescription/investigation/report pages.
9. Review pregnancy and OB ultrasound pages.
10. Review billing/invoice page.
11. Review AI draft placeholder page and confirm it is disabled/mock-only.

## Automated Checks

```powershell
npm run typecheck
npm run build
npm run smoke:test
npm run test:security
npm run test:security:ci
npm run test:security:expanded
npm run test:e2e:v01
```

Optional focused checks:

```powershell
npm run test:consent:privacy
npm run test:error:safety
npm run backup:verify -- -BackupFile backups/prij-clinic-local-YYYYMMDD-HHMMSS.sql
```

## Role QA

Use:

- `docs/PILOT_QA_CHECKLIST.md`
- `docs/ROLE_BASED_TEST_PLAN.md`
- `docs/ROLE_PERMISSION_MATRIX.md`
- `docs/RBAC_MATRIX.md`

The owner role is the broad positive-control role. Lower-role checks should verify denials for clinical signing, billing management, AI review, admin/audit, and out-of-branch referenced records according to the matrix.

## Staging Demo

Use:

- `.env.staging.example`
- `docs/STAGING_RUNBOOK.md`
- `docs/STAGING_DEPLOYMENT.md`
- `docker-compose.staging.example.yml`
- `.github/workflows/staging-deploy-placeholder.yml`

Staging must use HTTPS, secret-managed values, staging-only Postgres, backup before deployment, and synthetic data only.

## Demo Exit Criteria

- All requested pages load.
- Automated checks pass or produce only documented V0.1 warnings.
- No real patient data or secrets were entered.
- AI stayed disabled/mock-only.
- No production claims were made.
- QA findings are recorded for V0.2.

