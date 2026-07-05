# Environment Variables

Use `.env.example` for local placeholders and `.env.production.example` for production-shaped placeholders. Do not commit real `.env` files, secrets, passwords, tokens, patient data, or database files.

Required production/staging checks:
- `APP_ENV` and `NODE_ENV` must match the target environment.
- `DATABASE_URL` must be configured outside git and must never be printed.
- `JWT_SECRET` must be configured outside git and must never be printed.
- `APP_URL`, `API_URL`, and `NEXT_PUBLIC_API_URL` must use HTTPS for staging and production.
- `DEMO_MODE=false` for production-shaped environments.
- `PATIENT_FILE_STORAGE_MODE=metadata_only` unless a reviewed secure storage mode is approved.
- `AI_FEATURES_ENABLED=false` and `AI_PROVIDER=disabled` by default.

Production guidance:
- Store secrets in the deployment platform or a managed secret store.
- Rotate secrets through an admin-controlled process.
- Keep demo credentials and demo seed flags disabled.
- Do not enter real patient data until legal/privacy, backup/restore, deployment, and role-by-role QA gates are complete.
