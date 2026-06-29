# Database Deployment Workflows

Date: 2026-06-29

Prij Clinic database workflows must keep demo data separate from production behavior. Do not use real patient data in local, staging, tests, screenshots, or demo docs.

## Migration Rules

- Local development may use `npm run prisma:migrate:local -- migration_name` only when intentionally creating a new migration.
- Staging and production must use:

```powershell
npm run prisma:migrate:deploy
```

- Do not run `prisma migrate dev` in staging or production.
- Do not reset, drop, or delete migrations in staging or production.
- Stop immediately if any command asks to reset a database.

## Local Demo Seed

Use only for local development:

```powershell
npm run prisma:seed
```

Expected local settings:

```text
APP_ENV=local
SEED_DEMO_DATA=true
SEED_DEMO_OWNER=true
```

This creates demo users, the local `eyad` admin demo login, demo patients, demo appointments, queue records, reports, pregnancy/ultrasound placeholders, billing metadata, and disabled AI draft placeholders.

## Staging Demo Seed

Use only in a staging environment that is explicitly fake/demo data only:

```powershell
npm run prisma:migrate:deploy
npm run prisma:seed
```

Expected staging settings:

```text
APP_ENV=staging
NODE_ENV=production
SEED_DEMO_DATA=true
SEED_DEMO_OWNER=true
DEMO_OWNER_PASSWORD=<staging-demo-password>
DEMO_ADMIN_PASSWORD=<staging-demo-admin-password>
DEMO_TEST_PASSWORD=<staging-demo-password>
```

Staging demo passwords must not be `eyad` or `LocalDev123!`. Staging must never receive real patient data.

## Production Minimal Seed

Production seed is minimal only:

```powershell
npm run prisma:migrate:deploy
npm run prisma:seed
```

Required production settings:

```text
APP_ENV=production
NODE_ENV=production
SEED_DEMO_DATA=false
SEED_DEMO_OWNER=false
```

With those settings, the seed script creates or updates only foundational roles, permissions, branches, and safe system settings. It does not create:

- `eyad` / `eyad`
- demo users
- demo patients
- demo appointments or queue records
- demo clinical records
- demo reports
- demo invoices or payments
- demo AI drafts

Production staff provisioning must be a separate audited admin process before any real launch.

## Safety Checks

- Demo passwords are rejected in production.
- Demo seed flags are rejected in production.
- AI stays disabled.
- Report/private clinical file uploads remain disabled until secure storage is implemented.
- Production patient use remains blocked until legal, security, privacy, backup, monitoring, and restore-proof gates pass.
