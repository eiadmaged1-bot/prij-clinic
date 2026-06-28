# Environment Strategy

Prij Clinic V0.1 release-candidate foundations support local development, CI, and documented staging/production configuration boundaries. V0.1 is still not approved for real patient data or production clinical operations.

## Local Development

Local development uses:

- Docker Postgres from `docker-compose.yml`.
- Root `.env` for local-only values.
- Demo seed data only.
- AI disabled/mock-only.
- No real patient data, report files, payment data, or secrets in git.
- Local-only uploads and backups under ignored folders.

Recommended local commands:

```powershell
npm run dev:stop
npm run prisma:repair
npm run prisma:seed
npm run dev:api
npm run dev:web
```

## CI

CI uses GitHub Actions with PostgreSQL service containers and placeholder env values.

Required CI safety settings:

- `AI_FEATURES_ENABLED=false`
- `AI_PROVIDER=disabled`
- `NODE_ENV=test`
- Placeholder `JWT_SECRET`
- Demo-only seed data

See `.env.ci.example` and `.github/workflows/security-integration.yml`.

## Staging

Staging is a controlled demo/QA environment only. It must use placeholders from `.env.staging.example` as a template and real values from a secret manager or deployment platform.

Before staging:

- Use a managed or hardened Postgres instance.
- Use a secrets manager.
- Enable HTTPS.
- Configure backup and restore testing.
- Keep AI disabled unless a separate approved safety design exists.
- Use synthetic/demo data only until legal/privacy review is complete.
- Configure PHI-safe logging and monitoring.
- Use private upload storage with authorization and audit controls before any file testing.

## Production

Production is not approved for V0.1. `.env.production.example` is a readiness checklist only, not a deployment approval.

Before production, the project needs:

- Managed database or hardened self-hosted Postgres.
- Encrypted backups and restore tests.
- Secure report file storage.
- HTTPS and secure cookie/session policy.
- MFA/2FA for admins and clinical users.
- Monitoring and alerting.
- Logging that avoids PHI and secrets.
- Audit retention policy.
- Secrets manager.
- Legal/privacy review.
- Data processing agreements for any hosted services.
- Separate AI consent, provider, privacy, RBAC, audit, and doctor-review approval if cloud AI is ever considered.

## Runtime Validation

The API validates required runtime variables at startup:

- `DATABASE_URL`
- `JWT_SECRET`
- `AI_FEATURES_ENABLED` must not be `true`.
- `AI_PROVIDER` must be unset or `disabled`.
- `APP_ENV=production` requires an HTTPS `APP_URL` and a non-placeholder JWT secret.

Validation errors name missing or unsafe variable names only. They must not print secret values.
