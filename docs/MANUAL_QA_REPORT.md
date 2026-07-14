# Manual QA Report

Date: 2026-07-14 (Africa/Cairo). Branch: `fix/v1.4.3-db-migration-public-proxy-lock`.

All mutable QA used synthetic records in disposable databases. This is not production or clinical-safety signoff.

## Database and automated QA

Passed:

- Preserved database: backup verification, migration reconciliation, empty schema diff, Prisma generation, `prisma:repair`, and idempotent seed.
- Fresh database: all 51 migrations, schema validation/diff, generation, seed twice with stable counts, typecheck, and production build.
- Production database suites: architecture boundaries, pagination (6 pages/132 events), search budgets (maximum observed 90 ms), transaction boundaries, and migration chain.
- Clinical suites: patient workspace, smart tags/multi-tag search, doctor visit, prescription/A5 print, investigations/favorites, medication reference/import, external intake, clinical persistence (17/17), and OB/GYN core (11/11).
- Security: security CI (24 pass, 2 warnings), expanded security (6/6 groups), accounts/RBAC (18/18), audit assertions (33/33), role operations, CORS, PHI-safe log redaction, and v1.4.2 permission contracts.
- AI: safety passed; regression passed 10 checks with one synthetic-patient fallback warning.
- Proxy: v1.3.4 same-origin, v1.3.5 public-login, v1.3.6 proxy paths, and v1.3.7 one-tunnel contract tests.
- Backup readiness: v0.16.0 (15 checks) and v0.18.0 staging readiness (14 checks).

One non-blocking legacy failure remains: `test:v139:clinical-tags-edd-intake` expects a removed permanent patient QR label. The current v1.4.3 feature-specific suites pass.

## Local proxy QA

- API: `127.0.0.1:3001`; web: `127.0.0.1:3000`; internal origin: `http://127.0.0.1:3001`.
- `/api/backend/health` and `/api/backend/health/live`: HTTP 200 with `{ "status": "up" }`.
- Signed synthetic intake dry run: HTTP 200 when an ephemeral test secret was configured.
- Invalid signature: HTTP 403. Oversized body: HTTP 413.
- Query forwarding, session cookies, raw-body preservation, request-size bounds, header allowlist, and no browser-Origin forwarding were verified.

## Public/ngrok QA

URL: `https://regretful-unwomanly-silliness.ngrok-free.dev`.

- Exactly one tunnel targeted web port 3000. Web and API both listened on `127.0.0.1`; API port 3001 was not tunneled.
- `/login`, `/api/backend/health`, and `/api/backend/health/live`: HTTP 200.
- Authenticated synthetic QA returned HTTP 200 for Doctor, Reception, dashboard, Patient Files, patient workspace, prescriptions, A5 print preview, investigations, pharmacology/medications, and guidelines.
- No developer overlay or raw stack appeared in the checked HTML.
- Invalid-signature Google intake returned HTTP 403 with `PERMISSION_DENIED`; the external-submission count remained unchanged.
- A public signed dry run was not run because the HMAC secret is not configured. No secret was invented.
- Current public runtime logs contained no exact synthetic credential, unredacted password, MRN, raw stack, or forwarded browser-Origin entry.

The tunnel and both services were stopped after QA. Both disposable databases were deleted; the preserved development database was not deleted or reset.
