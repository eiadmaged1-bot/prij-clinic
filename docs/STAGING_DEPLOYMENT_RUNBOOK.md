# Staging Deployment Runbook

Date: 2026-06-29

Staging is for fake/demo data only. Do not enter real patient data, PHI files, real payment details, or real external AI credentials.

## 1. Provision Server

- Provision a staging server: `<STAGING_SERVER>`.
- Configure firewall rules for SSH, HTTP/HTTPS, and any approved internal access.
- Do not expose the database port publicly.
- Create a deploy user with least necessary access.

## 2. Install Dependencies

Install Docker, Docker Compose, Git, and Node.js only if needed for local verification:

```bash
docker --version
docker compose version
git --version
node --version
npm --version
```

## 3. Clone Repository

```bash
git clone <REPO_URL> prij-clinic
cd prij-clinic
git checkout deploy/local-staging-trial
```

## 4. Configure Environment

Create `.env.staging` from `.env.staging.example` on the server:

```bash
cp .env.staging.example .env.staging
```

Set placeholder values to staging-only values:

- `APP_ENV=staging`
- `NODE_ENV=production`
- `APP_URL=https://staging.example.invalid`
- `API_URL=https://staging-api.example.invalid`
- `NEXT_PUBLIC_API_URL=https://staging-api.example.invalid`
- `DATABASE_URL=postgresql://...`
- strong `JWT_SECRET`
- staging demo passwords that are not local defaults
- `AI_FEATURES_ENABLED=false`
- `AI_PROVIDER=disabled`

Do not commit `.env.staging`.

For a local staging trial on Windows, copy the example and edit only local fake-data values:

```powershell
Copy-Item .env.staging.example .env.staging
notepad .env.staging
npm run staging:env:check
```

The checker confirms required staging values are present, AI is disabled, demo seed is intentional, local default demo passwords are not used, and the staging JWT secret is long enough. It does not print secret values.

When running compose locally for the staging trial, pass the ignored env file and an isolated project name:

```powershell
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml up -d postgres
```

## 5. Start Database

```bash
docker compose -f docker-compose.staging.yml up -d postgres
docker compose -f docker-compose.staging.yml ps
```

Wait until the database healthcheck is healthy.

## 6. Run Migrations

Run migration deploy, not migration dev:

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml run --rm api npm run prisma:migrate:deploy
```

Stop if a command asks to reset data.

## 7. Seed Staging Demo Data

Staging may use fake/demo data only:

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml run --rm api npm run prisma:seed
```

Confirm:

- `APP_ENV=staging`
- `SEED_DEMO_DATA=true`
- demo passwords are staging-only and not `eyad` or `LocalDev123!`

## 8. Start API and Web

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml up -d --build api web
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml ps
```

Startup order:

1. Postgres healthy.
2. Prisma migrations deployed.
3. Staging demo seed applied.
4. API starts and `/health` passes.
5. Web starts after API is healthy.
6. Reverse proxy routes public traffic to web/API.

## 9. Verify Health Endpoints

```bash
curl -f https://staging-api.example.invalid/health
curl -f https://staging-api.example.invalid/health/db
curl -f https://staging.example.invalid/login
```

Use actual staging hostnames.

## 10. Run Smoke Tests

From a machine allowed to reach staging:

```bash
API_URL=https://staging-api.example.invalid npm run test:security:ci
```

For the local staging deployment trial:

```powershell
npm run test:staging:smoke
```

For local browser-facing checks, set:

```bash
WEB_URL=https://staging.example.invalid API_URL=https://staging-api.example.invalid npm run test:visual:qa
```

## 11. Login Test

- Open `<STAGING_WEB_URL>/login`.
- Sign in with staging demo credentials only.
- Confirm dashboard loads.
- Confirm non-admin staff cannot open admin/appearance settings.

## 12. Patient Workflow Test

Use fake demo data only:

1. Create a demo patient.
2. Open the patient file.
3. Create appointment/check-in.
4. Create guided visit draft.
5. Add prescription/order/report placeholder.
6. Add pregnancy/ultrasound recording-only data.
7. Add invoice/payment metadata.
8. Confirm timeline aggregation.
9. Confirm audit entries exist.

## 13. Rollback Plan

If deployment fails:

1. Stop web/API containers:

```bash
docker compose -f docker-compose.staging.yml stop web api
```

2. Revert to the previous known-good Git commit or image tag.
3. Rebuild/restart API and web.
4. Do not reset/drop the database.
5. Restore only into a disposable restore-test database unless an approved incident plan authorizes staging restore.
6. Record the failure, logs, rollback commit, and verification result.

## Staging Exit Criteria

- Health endpoints pass.
- Security CI passes.
- Expanded security passes when run against staging-compatible data.
- Visual QA passes.
- Demo login works.
- Non-admin admin denial works.
- Patient workflow test passes with fake data.
- Backup procedure has been tested.
