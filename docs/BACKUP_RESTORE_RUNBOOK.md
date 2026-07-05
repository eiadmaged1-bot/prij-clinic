# Backup Restore Runbook

v0.18.0 keeps backup and restore work in staging-readiness mode. This is not a completed production backup program.

Available local checks:
- `npm run backup:local`
- `npm run backup:verify`
- `npm run backup:readiness`
- `npm run backup:staging`
- `npm run test:v180:backup-staging-readiness`

Staging placeholders:
- Staging backup frequency: define per deployment before staging go-live.
- Manual staging backup command: `npm run backup:staging`.
- Backup verify command: `npm run backup:verify`.
- Backup directory placeholder: `BACKUP_DIR=backups/staging`.

Safety rules:
- Generated backups must stay in ignored paths such as `backups/`.
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
- Future task unless a separate safe, approved restore drill is completed.
