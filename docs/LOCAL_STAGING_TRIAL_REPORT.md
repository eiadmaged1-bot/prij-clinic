# Local Staging Trial Report

Date: 2026-06-29

Branch: `deploy/local-staging-trial`

Starting point: `hardening/staging-deployment-prep` at `38afbd2`, tag `v0.1-staging-prep`

## Scope

This trial used fake/demo data only. No real patient data, PHI uploads, real external AI, or real payment gateway was used.

## Results

- Docker API build: Passed after adding OpenSSL to the API image and copying API deployment scripts into the runtime image.
- Docker Web build: Passed with the staging compose image.
- Staging compose up: Passed locally with project `prij-clinic-staging`.
- Migration deploy: Passed with `npm run prisma:migrate:deploy` inside the API container.
- Staging seed: Passed only after explicit `npm run prisma:seed` with `APP_ENV=staging` and demo seed flags enabled.
- Healthcheck: Passed for Postgres, API, and Web containers.
- API health endpoint: `http://localhost:3001/health` returned 200.
- API database health endpoint: `http://localhost:3001/health/db` returned 200 with database connected.
- Web reachability: `http://localhost:3000/login` returned 200.
- Staging smoke test: Passed with `npm run test:staging:smoke`.
- Backup trial: Passed with `npm run backup:staging`, creating an ignored SQL dump under `backups/staging/`.
- Restore trial: Documented only. A destructive restore was not run against the active local staging database.

## Problems Found And Fixes Applied

- API runtime image did not include `apps/api/scripts/prisma.cjs`, so workspace migration and seed commands failed inside the container. Fixed by copying `apps/api/scripts` into the API runtime image.
- API Alpine image did not include OpenSSL, so Prisma generated/loaded an incompatible engine. Fixed by installing OpenSSL in API dependency, build, and runtime stages.
- Runtime environment validation and seed logic treated every `NODE_ENV=production` container as production, which blocked intentional staging demo seed. Fixed by using explicit `APP_ENV=production` for production behavior while keeping `APP_ENV=staging` as staging.
- Staging DB health smoke assertion expected `database: ok`; the actual contract returns `database: connected`. Fixed the smoke test to accept the current health contract.
- Staging demo owner login uses the seeded demo-user password when `demo.owner@prij.local` is part of the demo user set. The smoke test now follows that seeded account behavior.

## Remaining Blockers Before Real VPS Staging

- Provision the VPS, firewall, DNS, TLS, reverse proxy, and staging-only secrets.
- Run the same compose, migration, seed, health, smoke, backup, and visual QA sequence on the VPS.
- Add encrypted off-host backup storage and a restore-test environment before any pilot planning.
- Confirm no demo credentials or demo data path can be enabled for production.
- Complete legal, privacy, monitoring, incident-response, and operational sign-off before real patient use.
