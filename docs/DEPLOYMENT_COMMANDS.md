# Deployment Commands

v0.18.0 commands are for staging packaging and local production simulation only. They do not deploy externally and do not prove production readiness.

Local verification:
- `npm run prisma:generate`
- `npm run prisma:migrate:deploy`
- `npm run prisma:seed`
- `npm run staging:simulate`
- `npm run test:v180:staging-smoke`
- `npm run test:v180:backup-staging-readiness`
- `npm run typecheck`
- `npm run build`

Staging stack commands:
- Create a real untracked `.env.staging` from `.env.staging.example` using a secret store.
- `npm run staging:start`
- `npm run staging:health-check`
- `npm run staging:smoke`
- `npm run staging:stop`

Safety notes:
- Do not run `docker compose down -v`.
- Do not run migration reset/drop commands.
- Do not commit `.env.staging`, backups, uploads, logs, screenshots, reports, local database files, or secrets.
