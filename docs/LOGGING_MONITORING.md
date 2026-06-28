# Logging And Monitoring Foundation

Date: 2026-06-28

V0.1 release-candidate logging is intentionally conservative. It is not a production monitoring system and must not be used with real patient data.

## Current Foundation

- Public health endpoints expose only process/database readiness.
- API startup validates required environment settings without printing secret values.
- API error responses are shaped by a safe global exception filter.
- Error responses must not include stack traces, database connection strings, JWT secrets, bearer tokens, password hashes, or raw clinical request bodies.
- Audit logs store metadata for security-sensitive actions; they must not store raw clinical bodies, passwords, tokens, payment secrets, report file contents, or AI prompts.

## Logging Rules

- Do not log request bodies by default.
- Do not log full patient records, clinical notes, report summaries, uploaded file contents, passwords, tokens, cookies, payment card data, or gateway references.
- Prefer action names, resource IDs, branch IDs, status transitions, counts, and safe operational metadata.
- Keep debug logging disabled outside local development.
- Treat logs as sensitive operational data even when PHI is excluded.

## Monitoring Requirements Before Production

- Centralized PHI-safe application logs.
- Error-rate and latency alerts.
- Database health monitoring.
- Backup job and backup verification monitoring.
- Failed login and account lockout monitoring.
- Audit-log review workflow.
- Storage upload/download anomaly alerts when file storage is implemented.
- Incident response runbook and responsible contacts.

## Automated Check

`npm run test:error:safety` verifies representative error responses do not expose stack traces, database URLs, JWT secret names/values, bearer tokens, password hashes, or password-like input.
