# v0.18.0 Staging Deployment Package

v0.18.0 prepares a safe staging deployment package for Prij Clinic. It is not a production release and must not be used with real patient data.

Included:
- Hardened `.env.staging.example` with placeholders only.
- `docker-compose.staging.yml` for staging-shaped API, web, and PostgreSQL services.
- Staging start, stop, health-check, smoke, and local production simulation scripts.
- Migration deploy verification through `npm run prisma:migrate:deploy`.
- Backup readiness checks and runbook updates.
- Static staging smoke checks for protected routes, health endpoints, AI-disabled defaults, seed safety, and secret hygiene.

Safety boundaries:
- Real patient data remains blocked.
- External AI is disabled by default with `AI_PROVIDER=disabled_mock` and `EXTERNAL_AI_ENABLED=false`.
- AI output remains draft-only until reviewed and approved by a doctor.
- No WhatsApp, DICOM/PACS, insurance/TPA, real payment gateway, full accounting ledger, mobile app, autonomous diagnosis, autonomous prescribing, autonomous dosing, treatment ranking, or fake production medical claims are added.

Production still requires legal/privacy review, a real backup and restore drill, HTTPS, monitoring, secrets management, role-by-role browser QA, and deployment hardening.
