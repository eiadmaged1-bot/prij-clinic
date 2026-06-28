# Staging Deployment Foundation

Date: 2026-06-28

This is a staging/demo readiness guide. It is not production approval and must not be used with real patient data.

## Purpose

Staging should prove deployment mechanics with synthetic data only:

- Container build and startup.
- Migration deploy.
- Demo seed or synthetic QA dataset.
- Typecheck/build parity with CI.
- Security integration tests.
- Backup verification and restore rehearsal in a non-production database.
- PHI-safe logging and monitoring checks.

## Required Inputs

- Secret-managed `DATABASE_URL`.
- Secret-managed `JWT_SECRET`.
- HTTPS app/API URLs.
- `AI_FEATURES_ENABLED=false`.
- `AI_PROVIDER=disabled`.
- No real patient, payment, report, image, scan, DICOM, or AI provider data.

## Example Files

- `.env.staging.example`
- `docker-compose.staging.example.yml`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`

## Staging Checklist

1. Build containers from the repository root.
2. Inject secrets through the deployment platform, not committed files.
3. Run `npm run prisma:migrate:deploy`.
4. Seed demo/synthetic data only if the staging goal requires it.
5. Run `npm run test:security:ci`.
6. Run `npm run test:security:expanded`.
7. Run backup verification with a staging-safe backup artifact.
8. Confirm logs do not include PHI, passwords, tokens, report contents, or payment secrets.

## Production Blockers

Do not move from staging to production until these are complete:

- Patient-to-doctor assignment or explicit clinical access policy.
- Production consent/legal review and enforcement.
- Secure PHI file storage implementation.
- Production backup encryption and restore proof.
- Audit retention and tamper-resistance.
- MFA/session hardening.
- Monitoring, alerting, and incident response ownership.
