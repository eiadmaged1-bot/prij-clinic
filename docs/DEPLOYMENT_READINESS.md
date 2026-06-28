# Deployment Readiness

Prij Clinic V0.1 is a local/private pilot foundation. It is GitHub-backed and CI-tested, but it is not ready for production deployment or real clinic operations.

## Ready For V0.1

- Local API and web app startup.
- Local Postgres development database.
- Prisma migrations and seed data.
- Typecheck and build in CI.
- PostgreSQL-backed security integration workflow.
- Demo-only workflow and security tests.
- Referenced-record write scope hardening for implemented MVP routes.
- Lower-role role matrix documentation and representative denial tests.
- Local backup/restore helper scripts.
- Environment examples with placeholders only.
- Runtime environment validation for required variables, disabled AI settings, and production-safe JWT/HTTPS checks.

## Not Ready For Production

- Real patient data.
- Real report file uploads.
- Real payment gateway.
- Real AI provider calls.
- Diagnostic fetal-image AI.
- Production consent enforcement.
- MFA/2FA.
- Production audit retention and tamper-resistance.
- Production backup encryption and restore-test evidence.
- Monitoring, alerting, and PHI-safe logging.
- Legal/compliance review.
- Real production secret manager integration.

## Required Before Deployment

- Add patient-to-doctor assignment or an explicit clinical access model.
- Complete exhaustive lower-role positive-path and state-transition tests.
- Add production audit retention, tamper-resistance, review, and alerting controls.
- Add production consent enforcement after legal/privacy review.
- Add production session and secret management.
- Add secure file storage implementation before any real report files or PHI attachments.
- Define backup retention, encryption, access, and restore ownership.
- Add deployment-specific infrastructure review.
- Add operational runbooks.
- Run staging demo and pilot QA with synthetic data only.

## Build And Start Commands

```powershell
npm run build
npm run build:api
npm run build:web
npm run start:api
npm run start:web
```

These commands assume dependencies are installed and required environment variables are configured outside source control.

## Environment Files

Tracked examples are placeholders only:

- `.env.example`
- `.env.ci.example`
- `.env.staging.example`
- `.env.production.example`

Real `.env` files remain ignored by git. Production values must be injected by a secret manager or deployment platform.
