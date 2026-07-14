# Current Status

Date: 2026-07-14 (Africa/Cairo). Branch: `fix/v1.4.3-db-migration-public-proxy-lock`.

## v1.4.3 reconciliation result

- A verified SQL backup was created at `C:\Newfolder\prij-clinic\backups\prij-clinic-local-20260714-032357.backup.sql` before any database change.
- The preserved PostgreSQL database is migration-current across 51 migrations and has an empty Prisma schema diff.
- `20260711120000_user_interface_preferences` was classified as partially applied: its enums, enum ordering, table, columns, constraints, indexes, nullability, and defaults were present except the `UserPreference.updatedAt` default.
- `GuidelineSource.abbreviation` was absent although its historical migration was recorded as applied. It is nullable with no default, unique constraint, or index requirement.
- Forward-only migration `20260714040000_reconcile_database_drift` restores the missing abbreviation and other proven historical defaults, nullable guideline fields, backfill/index state, and the user-preference timestamp default without deleting data or recreating enums.
- Protected operational table counts and deterministic hashes were identical before and after reconciliation/seeding.
- The complete 51-migration chain applies from zero to an empty disposable database with no manual intervention and an empty final schema diff.
- The seed is idempotent on both preserved and fresh databases; duplicate checks passed for permissions, clinical tags, investigations, medication generics/families, and guideline sources.

## Proxy and security result

- API binds to loopback only and public access uses web port 3000 plus `/api/backend/...`.
- `/api/backend/health` and `/api/backend/health/live` return the intentional safe body `{ "status": "up" }` locally and through the single ngrok tunnel.
- The proxy preserves status, query strings, cookies, bounded raw bodies, HMAC bytes, and allowlisted intake headers while excluding browser `Origin`, authorization, and untrusted forwarding headers.
- Expanded security, RBAC, audit, clinical persistence, AI safety/regression, external intake, transaction, pagination, search-budget, and migration-chain verification passed on disposable databases.
- AI output remains disabled/mock-only and draft-only until doctor review; no autonomous clinical action was introduced.

This remains development verification, not production, privacy, deployment, or clinical-governance signoff. See `docs/MIGRATION_RECONCILIATION_V1_4_3.md`, `docs/MANUAL_QA_REPORT.md`, and `docs/DEPENDENCY_AUDIT.md`.
