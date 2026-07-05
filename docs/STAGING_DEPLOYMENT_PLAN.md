# Staging Deployment Plan

v0.16.1 prepares a staging deployment path. It does not declare the system production-ready.

Plan:
- Provision staging infrastructure with PostgreSQL, HTTPS, explicit CORS origins, and managed secrets.
- Apply migrations with `npm run prisma:migrate:deploy`.
- Generate Prisma client with `npm run prisma:generate`.
- Build the API and web apps with `npm run build`.
- Run the v0.16.1 lock suite and protected regressions.
- Verify no real patient data, secrets, uploads, backups, logs, reports, screenshots, or local database files are committed.

Staging environment expectations:
- `DEMO_MODE=false` for any staging environment intended to resemble production.
- `APP_URL`, `API_URL`, and `NEXT_PUBLIC_API_URL` use HTTPS.
- `JWT_SECRET` and `DATABASE_URL` are present in the runtime environment but never printed.
- `AI_FEATURES_ENABLED=false` and `AI_PROVIDER=disabled` by default.
- Patient file storage remains metadata-only unless secure storage, metadata stripping, retention, and backup policies are approved.

Real patient data remains blocked until deployment, backup, legal/privacy, and role-by-role QA gates are complete.
