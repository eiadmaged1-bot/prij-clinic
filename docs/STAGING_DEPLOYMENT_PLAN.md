# Staging Deployment Plan

v0.18.0 prepares a staging deployment package only. It does not declare the system production-ready and must not be used with real patient data.

Plan:
- Provision staging infrastructure with PostgreSQL, HTTPS, explicit CORS origins, and managed secrets.
- Create untracked `.env.staging` from `.env.staging.example`.
- Apply migrations with `npm run prisma:migrate:deploy`.
- Generate Prisma client with `npm run prisma:generate`.
- Build the API and web apps with `npm run build`.
- Run `npm run staging:simulate`, `npm run test:v180:staging-smoke`, `npm run test:v180:backup-staging-readiness`, the v0.16.1/v0.17.1 lock suites, and protected regressions.
- Verify `/health` and `/health/db` before any browser smoke.
- Confirm staging backup frequency placeholder, manual backup command, backup verify command, and restore drill plan.
- Verify no real patient data, secrets, uploads, backups, logs, reports, screenshots, or local database files are committed.

Staging environment expectations:
- `DEMO_MODE=false` for any staging environment intended to resemble production.
- `APP_URL`, `WEB_ORIGIN`, `API_URL`, and `NEXT_PUBLIC_API_URL` use HTTPS.
- `CORS_ORIGINS` and `CORS_ALLOWED_ORIGINS` contain explicit HTTPS origins only.
- `JWT_SECRET` and `DATABASE_URL` are present in the runtime environment but never printed.
- `AI_FEATURES_ENABLED=false`, `AI_PROVIDER=disabled_mock`, and `EXTERNAL_AI_ENABLED=false` by default.
- Patient file storage remains metadata-only unless secure storage, metadata stripping, retention, and backup policies are approved.
- `BACKUP_DIR=backups/staging` is a placeholder path and must stay ignored.
- Restore must never run automatically; restore requires explicit admin/operator approval.

Production requires legal/privacy review, real backup/restore drill, HTTPS, monitoring, secrets management, role-by-role browser QA, and deployment hardening.
