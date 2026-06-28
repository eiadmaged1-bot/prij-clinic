# Deployment Readiness

Prij Clinic V0.1 is a local/private pilot foundation. It is GitHub-backed and CI-tested, but it is not ready for production deployment or real clinic operations.

## Ready For V0.1

- Local API and web app startup.
- Local Postgres development database.
- Prisma migrations and seed data.
- Typecheck and build in CI.
- PostgreSQL-backed security integration workflow.
- Demo-only workflow and security tests.
- Local backup/restore helper scripts.
- Environment examples with placeholders only.

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

## Required Before Deployment

- Harden referenced-record scope checks for all create/update paths.
- Complete lower-role permission matrix tests.
- Add production session and secret management.
- Add secure file storage design implementation.
- Define backup retention, encryption, access, and restore ownership.
- Add deployment-specific infrastructure review.
- Add operational runbooks.

## Build And Start Commands

```powershell
npm run build
npm run build:api
npm run build:web
npm run start:api
npm run start:web
```

These commands assume dependencies are installed and required environment variables are configured outside source control.
