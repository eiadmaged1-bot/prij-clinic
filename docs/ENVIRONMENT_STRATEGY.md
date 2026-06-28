# Environment Strategy

Prij Clinic V0.1 supports local development and CI only. It is not production-ready.

## Local Development

Local development uses:

- Docker Postgres from `docker-compose.yml`.
- Root `.env` for local-only values.
- Demo seed data only.
- AI disabled/mock-only.
- No real patient data, report files, payment data, or secrets in git.

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

Staging is not implemented yet. Before staging:

- Use a managed or hardened Postgres instance.
- Use a secrets manager.
- Enable HTTPS.
- Configure backup and restore testing.
- Keep AI disabled unless a separate approved safety design exists.
- Use synthetic/demo data only until legal/privacy review is complete.

## Production

Production is not approved for V0.1.

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
