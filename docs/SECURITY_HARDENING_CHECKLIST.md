# Security Hardening Checklist

Date: 2026-06-29

This checklist is required before staging and must be fully accepted before any production patient use. Staging remains fake/demo data only.

## Environment and Secrets

- [ ] No `.env`, `apps/api/.env`, private keys, tokens, backups, logs, uploads, or local DB files are committed.
- [ ] `APP_ENV` is set correctly for local, staging, or production.
- [ ] `JWT_SECRET` is unique per environment, random, and at least 32 characters for staging/production.
- [ ] Demo passwords such as `eyad` and `LocalDev123!` are not used in production.
- [ ] `SEED_DEMO_DATA=false` and `SEED_DEMO_OWNER=false` in production.
- [ ] `AI_FEATURES_ENABLED=false` and `AI_PROVIDER=disabled`.
- [ ] `APP_URL` and API URL values point to the approved environment domains only.

## Authentication and Access

- [ ] Remove or disable demo credentials before production.
- [ ] Review all owner/admin accounts before staging and before production.
- [ ] Confirm non-admin users cannot open admin tools or appearance settings.
- [ ] Review RBAC role assignments for Owner, Admin, Doctor, Nurse, Receptionist, Accountant, and Auditor roles.
- [ ] Confirm server-side authorization remains the source of truth; UI hiding is not treated as security.
- [ ] MFA/2FA is planned before real production use.

## Transport and Browser Security

- [ ] HTTPS is configured and enforced for staging and production.
- [ ] CORS is restricted to the approved web origin.
- [ ] Secure cookie/token storage behavior is reviewed for deployed HTTPS environments.
- [ ] Public reverse proxy does not expose internal-only ports beyond intended API/web routes.

## Clinical Safety and Privacy

- [ ] No real patient data in staging.
- [ ] No PHI uploads.
- [ ] No real payment gateway.
- [ ] No external AI calls.
- [ ] AI remains draft-only and cannot diagnose, prescribe, sign, or update final records.
- [ ] Consent workflow limitations are documented for demo/staging.
- [ ] Production legal/privacy review is complete before real patient use.

## Audit and Admin Controls

- [ ] Audit logs are reviewed for sensitive actions.
- [ ] Audit log retention policy is documented.
- [ ] Admin override policy requires reason and confirmation.
- [ ] Signed clinical records cannot be silently edited or hard-deleted.
- [ ] Audit logs cannot be deleted through normal app/API flows.

## Backup and Restore

- [ ] Staging backup procedure is tested.
- [ ] Backup encryption is configured.
- [ ] Backup storage access is restricted.
- [ ] Restore test is completed in a disposable environment.
- [ ] Restore proof is documented with date, operator, backup checksum, result, and issues.

## Monitoring and Incidents

- [ ] `/health` and `/health/db` are monitored.
- [ ] Failed login spikes are reviewed.
- [ ] Error logs are collected without PHI.
- [ ] Disk usage and database storage are monitored.
- [ ] Backup job failures alert an owner/admin.
- [ ] Incident response owner and support workflow are documented.

## Release Gate

- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Security tests pass.
- [ ] E2E workflow passes.
- [ ] Clinical persistence tests pass.
- [ ] Visual QA passes.
- [ ] No secrets or real patient data are staged.
