# Backup Readiness

v0.16.0 adds local backup readiness workflow checks. This is not a production backup, retention, monitoring, or disaster-recovery certification.

Scripts:

- `npm run backup:local` creates a local PostgreSQL dump under the ignored `backups/` folder.
- `npm run backup:verify` checks Docker/Postgres backup tooling and reports whether local backup artifacts exist.
- `npm run backup:readiness` prints the workflow guardrails and runs verification.
- `npm run test:v160:backup-readiness` verifies the source-level guardrails.

Rules:

- Generated backup files must never be committed.
- Restore is not run automatically by readiness scripts.
- Missing `pg_dump` reports a clear action: install PostgreSQL client tooling or rebuild the local Postgres service image.
- Scripts must not print secrets, connection strings, or PHI.
- Production backups require deployment-specific storage, encryption, monitoring, retention, and restore drills.
