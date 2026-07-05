# Deployment Prep Checklist

This checklist prepares Prij Clinic for staging deployment review only. It is not a production launch approval.

Required before staging:
- Generate Prisma client and deploy migrations without dropping or resetting the database.
- Run typecheck, build, v0.14.4 walkthrough, v0.15.0 business walkthrough, v0.16.0 security readiness, and v0.16.1 deployment-prep checks.
- Confirm `.env.production.example` uses placeholders only and does not contain secrets.
- Configure production/staging secrets outside git.
- Set `DEMO_MODE=false` outside local demo environments.
- Use HTTPS for `APP_URL`, `API_URL`, and `NEXT_PUBLIC_API_URL`.
- Keep `AI_FEATURES_ENABLED=false` and `AI_PROVIDER=disabled` unless a later reviewed sprint explicitly enables an external AI provider.
- Use `PATIENT_FILE_STORAGE_MODE=metadata_only` or a reviewed secure storage mode with metadata stripping, retention, access control, and backups.
- Document CORS origins explicitly; do not use broad wildcards for staging or production.
- Confirm backup path and upload/storage path guidance is implemented before real patient use.

Blocked before real patient data:
- Legal/privacy review.
- Role-by-role QA for Owner/Admin, Doctor, Receptionist, Accountant, and other clinic roles.
- Monitored backups, restore drill, retention, and incident response.
- Final production secrets, TLS, CORS, monitoring, and audit retention review.

Out of scope for v0.16.1:
- WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, real payment gateway, mobile app, external AI runtime calls, automatic diagnosis, automatic prescribing, automatic dosing, treatment ranking, and fake clinical claims.
