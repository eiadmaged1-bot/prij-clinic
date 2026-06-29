# Backup And Restore

Prij Clinic V0.1 includes local development backup/restore helpers and a staging backup plan. These are not yet a production backup system.

Do not run backup or restore workflows with real patient data until production backup, encryption, retention, legal, privacy, and restore-proof gates are approved.

## Production and Staging Warning

Never run destructive commands on staging or production unless there is an approved maintenance plan, verified backup, rollback plan, and explicit owner approval.

Forbidden without explicit incident approval:

- `docker compose down -v`
- database drop/reset commands
- deleting migrations
- restoring a backup over an active production database
- deleting audit logs, clinical records, uploads, backups, or private artifacts

## Local Backup

```powershell
npm run backup:local
```

The backup script:

- Starts or verifies the local Postgres container.
- Runs `pg_dump` inside `prij-clinic-postgres`.
- Writes a timestamped SQL file under `backups/`.
- Prints the backup path.

`backups/` is ignored by git. Do not commit backup files.

The local backup script was verified on 2026-06-29 and created an ignored SQL backup in `backups/`.

## Local Restore

Restore is guarded and must be requested explicitly:

```powershell
npm run restore:local -- -BackupFile backups/prij-clinic-local-YYYYMMDD-HHMMSS.sql -ConfirmRestore LOCAL_RESTORE
```

The restore script:

- Refuses to run in CI.
- Refuses to run with `NODE_ENV=production`.
- Requires an explicit backup file path.
- Requires `-ConfirmRestore LOCAL_RESTORE`.
- Never runs `docker compose down -v`.

Do not use restore unless you intentionally want to apply a local SQL backup to a local development database.

## Staging Backup Procedure

Staging must use fake/demo data only, but backup and restore discipline should still match production expectations.

For the local staging deployment trial, create a staging backup from the compose database with:

```powershell
npm run backup:staging
```

The helper reads `.env.staging`, refuses to run unless `APP_ENV=staging`, starts/verifies only the staging Postgres service, and writes a timestamped SQL backup under `backups/staging/`. It does not print secrets and does not restore or delete data. The generated backup path is ignored by Git and must not be committed.

1. Confirm you are connected to the staging host, not production.
2. Confirm the target database name and host.
3. Create a timestamped PostgreSQL dump with no owner or ACL metadata:

```bash
pg_dump "$DATABASE_URL" --no-owner --no-acl --format=custom --file "prij-clinic-staging-YYYYMMDD-HHMMSS.dump"
```

4. Encrypt the backup before moving it off the server:

```bash
gpg --symmetric --cipher-algo AES256 prij-clinic-staging-YYYYMMDD-HHMMSS.dump
```

5. Store the encrypted backup in restricted storage.
6. Record the backup time, operator, database name, checksum, and storage location in the staging operations log.
7. Delete unencrypted temporary dump files after verifying the encrypted copy.

Do not store backups in Git, app logs, uploads, or public folders.

## Backup Encryption Plan

- Use encrypted PostgreSQL dumps for staging and production.
- Use separate encryption passphrases or managed encryption keys per environment.
- Restrict backup read access to designated owners/admins only.
- Store checksums separately from the backup file.
- Rotate backup encryption credentials after staff changes or suspected exposure.
- Production backup storage must be off-host and access-controlled before real patient use.

## Restore Test Checklist

Run restore tests in a disposable restore-test environment only.

For the local staging trial, restore was documented as a checklist rather than applied to the active staging database. A destructive restore should only be tested against a new isolated restore-test project/database after a backup has been verified.

- Verify the backup file checksum before restore.
- Restore into an empty restore-test database.
- Run `npm run prisma:migrate:deploy` if migrations are expected after restore.
- Start the API against the restored database.
- Verify `/health` and `/health/db`.
- Verify login with a restore-test account.
- Verify patient, appointment, queue, encounter, prescription, investigation, report, pregnancy, ultrasound, billing, payment, consent, AI draft placeholder, and audit tables are present.
- Verify audit logs were restored and remain readable.
- Verify no backup file, private artifact, or secret was committed to Git.
- Record the restore result, date, operator, elapsed time, and issues.

Production use remains blocked until restore proof is repeated and accepted.
