# Local Backup And Restore

Prij Clinic V0.1 includes local development backup/restore helpers for pilot safety. These scripts are not a production backup system.

Do not run these scripts with real patient data. Do not commit backup files.

## Backup

```powershell
npm run backup:local
```

The backup script:

- Starts or verifies the local Postgres container.
- Runs `pg_dump` inside `prij-clinic-postgres`.
- Writes a timestamped SQL file under `backups/`.
- Writes a `.sha256` checksum sidecar next to the SQL file.
- Prints the backup path.

`backups/` is ignored by git.

## Verify Backup

Verification is non-destructive:

```powershell
npm run backup:verify -- -BackupFile backups/prij-clinic-local-YYYYMMDD-HHMMSS.sql
```

The verifier checks:

- Backup path is under ignored `backups/`.
- Filename matches the expected local backup pattern.
- File is not unexpectedly small.
- File looks like a plain `pg_dump` SQL backup.
- File does not include database-level create/drop statements.
- `.sha256` sidecar matches when present.

This verification does not restore data and does not prove a full production restore.

## Restore

Restore is guarded and must be requested explicitly:

```powershell
npm run restore:local -- -BackupFile backups/prij-clinic-local-YYYYMMDD-HHMMSS.sql -ConfirmRestore LOCAL_RESTORE
```

The restore script:

- Refuses to run in CI.
- Refuses to run with `NODE_ENV=production`.
- Requires an explicit backup file path.
- Requires the expected local backup filename pattern.
- Verifies the checksum sidecar when present.
- Requires `-ConfirmRestore LOCAL_RESTORE`.
- Never runs `docker compose down -v`.

Do not use restore unless you intentionally want to apply a local SQL backup to the local development database.

## Production Requirements Later

Before real clinic use, backups need:

- Encrypted storage.
- Restricted access.
- Off-machine copies.
- Scheduled runs.
- Restore tests.
- Backup verification before restore attempts.
- Audit records for backup and restore operations.
- Separate strategy for report/file storage if uploads are enabled.
