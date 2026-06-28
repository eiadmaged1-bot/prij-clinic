# Incident Response Foundation

Date: 2026-06-28

This is a V0.1 release-candidate incident response foundation. It is not a complete production policy.

## Immediate Stop Conditions

Stop use and investigate immediately if any of the following occurs:

- Real patient data is entered into a demo/local environment.
- Secrets, API keys, tokens, logs, uploads, backups, or local database files are staged or committed.
- External AI access is enabled.
- AI can diagnose, prescribe, sign, update final clinical records, or bypass RBAC/consent/doctor approval.
- A command requests database reset, deletes migrations/data, or runs `docker compose down -v`.
- Report files or PHI uploads are added without auth, audit, scope checks, and storage controls.

## First Response Checklist

1. Stop affected local services with `npm run dev:stop`.
2. Preserve relevant metadata without copying PHI into chat, issues, commits, logs, or screenshots.
3. Check `git status` for forbidden files before any commit.
4. Rotate any exposed local/demo credentials.
5. Review audit logs for affected actor, resource, branch, and action metadata.
6. Verify backup availability without running restore unless explicitly approved.
7. Document the incident using metadata only.

## Production Requirements Later

- Named incident owner and escalation contacts.
- Legal/privacy breach assessment process.
- Evidence preservation process.
- Secret rotation runbooks.
- Backup restore runbooks.
- Patient/clinic notification process where legally required.
- Post-incident review and corrective-action tracking.
