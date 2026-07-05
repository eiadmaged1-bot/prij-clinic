# Production Readiness Checklist

v0.16.0 prepares production readiness gates for real patient data review. It does not claim full legal, compliance, operational, or production readiness.

Required before real patient data:

- `APP_ENV=production` and `NODE_ENV=production` configured by deployment.
- `DATABASE_URL` present in the deployment environment, never committed.
- `JWT_SECRET` set to a strong production secret, never an example value.
- `JWT_EXPIRES_IN` set to a short seconds/minutes/hours value.
- `APP_URL` and production CORS origins use HTTPS.
- `DEMO_MODE=false`.
- `SEED_DEMO_DATA=false` and `SEED_DEMO_OWNER=false`.
- `PATIENT_FILE_STORAGE_MODE` is not `local_demo_file` in production.
- `AI_FEATURES_ENABLED=false` and `AI_PROVIDER=disabled` unless a future reviewed deployment explicitly enables an approved provider.
- Production backups, restore drills, monitoring, privacy/legal review, and incident response are complete.

Default/demo credentials:

- Demo passwords are forbidden in production.
- Example env files contain placeholders only.
- No secrets, patient data, uploads, logs, backups, PDFs, spreadsheets, or raw imports should be committed.
