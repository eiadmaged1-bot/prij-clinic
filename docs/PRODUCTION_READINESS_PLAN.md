# Production Readiness Plan

Date: 2026-06-29

Prij Clinic V0.1 is a verified MVP release candidate for local/private demo review. The current sprint prepares staging deployment with fake/demo data only. It is not approved for real patient use. The items below are required before staging trial, pilot, or production handling of real clinical data.

## Staging Prep Status

Completed in `hardening/staging-deployment-prep`:

- Placeholder-only environment examples for local, API, web, staging, and production.
- API startup validation for required environment settings and production demo credential rejection.
- Production minimal seed path that skips demo users and demo records.
- Staging Docker Compose, production compose example, API/web Dockerfiles, and nginx example.
- Database deployment workflows and migration deploy documentation.
- Backup/restore, security hardening, staging runbook, monitoring plan, and release gate docs.

Next sprint: Staging Deployment Trial.

## 1. Hosting And Environment

- Define separate local, CI, staging, pilot, and production environments.
- Use HTTPS and a real domain for staging/pilot/production.
- Keep `.env` files out of Git and move production secrets to a secrets manager or hardened environment-variable system.
- Remove local demo credentials from any non-local seed path.
- Validate required variables at startup without printing secret values.
- Configure CORS, app URLs, database URLs, storage paths, backup locations, logging level, and AI flags per environment.

## 2. Security

- Remove `eyad` / `eyad` and all demo passwords before staging or production data.
- Enforce strong password policy, password reset, account recovery, session revocation, and device/session inventory.
- Add MFA/2FA for Owner/Admin and privileged clinical roles.
- Complete RBAC review for every role and every state transition.
- Keep admin override policy reason-required, audited, and limited to void/archive/deactivate/correction flows.
- Add audit retention, export review, tamper-resistance controls, and suspicious-action alerting.
- Encrypt backups and prove restore regularly.

## 3. Privacy And PHI

- Do not enter real patient data until legal/privacy/security approval is complete.
- Finalize consent templates, signature/capture policy, revocation handling, and consent override workflow.
- Implement secure PHI file storage before report attachments or uploads:
  - encryption at rest and in transit
  - access control by patient/branch/user permission
  - malware scanning
  - audit logging for upload/view/download
  - expiring links only, no public file URLs
  - retention and deletion policy
- Define data retention, export/print controls, breach handling, and legal review.

## 4. Database

- Use `npm run prisma:migrate:deploy` for staging/production migrations.
- Do not run reset/drop commands in staging or production.
- Separate demo seed data from staging/production bootstrap data.
- Establish backup schedule, off-site encrypted backup storage, and restore-test schedule.
- Document rollback strategy and migration verification checks.

## 5. AI Safety

- Keep AI disabled/mock-only until separate approval.
- Any future external AI provider requires consent, privacy review, provider contract, RBAC, audit, prompt-injection controls, and clinical governance.
- AI output must remain draft-only and doctor-reviewed.
- AI must not diagnose, prescribe, sign, update final records, bypass RBAC, bypass consent, or bypass doctor approval.
- OB ultrasound must not use diagnostic fetal-image AI or automated FGR diagnosis.

## 6. Clinic Workflow Readiness

- Finalize role-by-role training scripts for Owner, Reception, Doctor, Nurse, Accountant, and Admin.
- Define downtime/offline plan, data-entry correction policy, support process, and incident escalation.
- Validate patient-to-doctor assignment or another explicit clinical access model.
- Review billing/payment compliance before adding any real payment gateway.
- Run pilot QA with fake data before any real clinic pilot.

## 7. Launch Gates

| Gate | Required Result |
| --- | --- |
| Local demo gate | All local tests pass; fake-data workflow demo succeeds; no real PHI |
| Staging gate | Fake/demo data only; staging-specific demo credentials; HTTPS; protected secrets; backups; deploy runbook; smoke/security tests |
| Pilot gate | Legal/privacy/security signoff; consent workflow; backup restore proof; monitoring; support process |
| Production gate | Full operational approval, audit retention, incident response, MFA, secure storage, and clinical governance |

## Next Sprint

Exact next sprint: Staging Deployment Trial.
