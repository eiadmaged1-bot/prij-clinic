# Staging Runbook

Date: 2026-06-28

This runbook prepares a controlled V0.1 staging/demo release candidate. It is not production approval and must not be used with real patient data, real PHI files, real payment credentials, or real AI provider access.

## Required Staging Environment

Use `.env.staging.example` as the template and inject actual values through the hosting platform or secret manager.

Required settings:

- `APP_ENV=staging`
- `NODE_ENV=production`
- `APP_URL=https://staging.example.invalid`
- `API_URL=https://staging-api.example.invalid`
- `CORS_ORIGIN=https://staging.example.invalid`
- `DATABASE_URL` from a secret manager
- `JWT_SECRET` from a secret manager
- `AI_FEATURES_ENABLED=false`
- `AI_PROVIDER=disabled`
- `UPLOAD_STORAGE_ROOT` pointing to private non-public storage if files are ever tested
- `LOG_LEVEL=info`

Do not commit real staging values.

## Database Setup

1. Provision a staging-only PostgreSQL database.
2. Confirm it contains no real patient data.
3. Confirm backups are configured before deployment.
4. Apply existing migrations only:

```powershell
npm run prisma:migrate:deploy
```

Do not run `prisma migrate dev`, database reset, migration deletion, or `docker compose down -v` for staging.

## Seed Strategy

- Use demo/synthetic seed data only.
- Local development can use `npm run demo:reset`.
- Staging should run `npm run prisma:seed` only when the goal is demo QA with synthetic data.
- If a staging database has manual QA data, take a backup before reseeding.

## Deployment Sequence

1. Confirm CI is green for the commit/tag being deployed.
2. Confirm the release tag and branch are documented.
3. Take a staging database backup.
4. Build API and web artifacts from the same commit.
5. Inject staging secrets through the platform.
6. Run `npm run prisma:migrate:deploy`.
7. Optionally run `npm run prisma:seed` for synthetic demo data.
8. Start API and web.
9. Confirm HTTPS is active for app and API.
10. Run post-deploy smoke and security checks.

## Post-Deploy Checks

Run against staging URLs where supported:

```powershell
npm run smoke:test
npm run test:security:ci
npm run test:security:expanded
npm run test:e2e:v01
```

Manual browser checks:

- `/`
- `/login`
- `/dashboard`
- `/patients`
- `/patients/new`
- `/consents`
- `/appointments`
- `/calendar`
- `/queue`
- `/encounters`
- `/prescriptions`
- `/investigations`
- `/reports`
- `/pregnancies`
- `/ultrasound`
- `/billing`
- `/ai-drafts`

## Rollback Plan

1. Stop new demo QA activity.
2. Preserve logs without exposing PHI or secrets.
3. Redeploy the previous known-good image or commit.
4. Restore the staging database only from an approved staging backup and only after explicit operator confirmation.
5. Rerun smoke/security checks.
6. Record incident notes and follow-up tasks.

Do not run destructive restore commands automatically.

## Required Approval Gates Before Real Patients

- Legal/privacy review.
- Production consent workflow and enforcement.
- Secure PHI file storage implementation.
- Production backup encryption and restore proof.
- Audit retention and tamper-resistance.
- MFA/session hardening.
- Monitoring and alert ownership.
- No external AI provider until consent, provider privacy, RBAC, audit, and doctor-review controls are complete.

