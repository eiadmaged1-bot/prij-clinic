# Backup Restore Runbook

v0.16.1 locks backup and restore readiness documentation. This is staging/deployment prep only, not a completed production backup program.

Available local checks:
- `npm run backup:local`
- `npm run backup:verify`
- `npm run backup:readiness`

Safety rules:
- Generated backups must stay in ignored paths such as `backups/`.
- Generated backups must never be committed.
- Restore is manual and admin-controlled only.
- Do not run destructive restore during readiness checks.
- Do not drop, reset, or volume-delete databases as part of this runbook.

Before real patient data:
- Configure monitored backups.
- Define retention and encryption requirements.
- Perform a documented restore drill in a controlled non-production environment.
- Confirm restore access is limited to authorized administrators.
- Confirm backup artifacts are excluded from git and deployment bundles.

Restore drill status:
- Future task unless a separate safe, approved restore drill is completed.
