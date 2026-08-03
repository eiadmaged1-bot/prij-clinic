# Backup Restore Runbook

v0.18.0 keeps backup and restore work in staging-readiness mode. This is not a completed production backup program.

Available local checks:
- `npm run backup:local`
- `npm run backup:verify`
- `npm run backup:readiness`
- `npm run backup:staging`
- `npm run restore:staging:drill -- --ConfirmRestore STAGING_RESTORE_DRILL`
- `npm run test:v180:backup-staging-readiness`

Staging placeholders:
- Staging backup frequency: define per deployment before staging go-live.
- Manual staging backup command: `npm run backup:staging`.
- Backup verify command: `npm run backup:verify`.
- Backup directory placeholder: `BACKUP_DIR=backups/staging`.

Safety rules:
- Generated backups must stay in ignored paths such as `backups/`.
- Staging backups are confined to `backups/staging/` and receive a SHA-256 sidecar that the restore drill verifies before execution.
- The restore drill accepts only canonical staging backup names and rejects cross-database, shell, extension, and program-copy commands.
- Generated backups must never be committed.
- Restore is manual and admin-controlled only.
- Restore must never run automatically.
- Restore requires explicit admin/operator approval.
- Do not run destructive restore during readiness checks.
- Do not drop, reset, or volume-delete databases as part of this runbook.
- Backups must be encrypted/secured in real deployment.
- Local readiness is not production backup readiness.

Before real patient data:
- Configure monitored backups.
- Define retention and encryption requirements.
- Perform a documented restore drill in a controlled non-production environment.
- Confirm restore access is limited to authorized administrators.
- Confirm backup artifacts are excluded from git and deployment bundles.

Restore drill status:
- A local fake-data staging restore drill passed on 2026-08-03.
- The guarded command verifies the backup path and checksum, restores it into a disposable `_restore_drill` database, compares successful migrations, public tables, and core User/Patient/Branch/AuditLog row counts, and reports success only after that disposable database is removed.
- This local proof is not production backup readiness. A monitored, encrypted, off-host backup and restore-test environment remain required before real patient use.
