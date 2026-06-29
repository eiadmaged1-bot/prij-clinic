# Operations Monitoring Plan

Date: 2026-06-29

This plan is for staging deployment preparation. Staging uses fake/demo data only. Production patient use remains blocked until launch gates pass.

## Health Endpoints

Monitor:

- `GET /health`
- `GET /health/db`
- Web `/login`

Expected behavior:

- `/health` returns API readiness.
- `/health/db` confirms database connectivity.
- `/login` confirms the web app is reachable.

## Uptime Monitoring

Use a simple HTTP uptime monitor for staging. External paid services are optional, not required.

Minimum checks:

- Staging web URL every 1-5 minutes.
- Staging API health every 1-5 minutes.
- Staging DB health through the API health endpoint.

## Error Logging

- Collect API and web container logs.
- Do not log passwords, bearer tokens, full clinical notes, report contents, payment secrets, or real patient data.
- Redact request authorization headers.
- Keep staging logs restricted to maintain operational discipline even though staging is fake/demo only.

## Audit Log Review

Review audit entries for:

- admin login and settings changes
- service price changes
- admin override attempts
- clinical create/update/sign actions
- billing/payment changes
- consent changes
- AI draft placeholder review
- repeated denied access attempts

Audit logs must not be deleted through normal app or API flows.

## Backup Monitoring

- Confirm staging backup job runs on the intended schedule.
- Alert if backup job fails.
- Record backup checksum and encrypted storage location.
- Periodically run a restore test into a disposable restore-test environment.

## Disk Usage

Monitor:

- Docker volume size
- database volume size
- container log growth
- backup staging directory
- available disk percentage

Set alerts before disk usage reaches a service-impacting threshold.

## Database Health

Track:

- `/health/db` result
- database container healthcheck
- connection failures
- migration deploy status
- backup and restore-test status

Do not run destructive database commands during normal operations.

## Failed Login Monitoring

Review:

- repeated failed logins
- account lockout events
- admin login failures
- login attempts outside expected demo staff accounts in staging

Staging credentials must be demo-only and must not reuse production or personal passwords.

## Incident Response Basics

1. Identify impacted service: web, API, database, reverse proxy, or host.
2. Preserve logs without exposing PHI or secrets.
3. Stop only the affected service if needed.
4. Avoid database reset/drop commands.
5. Use the rollback plan in `docs/STAGING_DEPLOYMENT_RUNBOOK.md`.
6. Document timeline, operator, root cause, fix, and follow-up.
7. Re-run release gate checks after recovery.

## Support Workflow

- Maintain one owner for staging operations.
- Record demo issues with page, user role, time, expected behavior, actual behavior, and screenshots using fake/demo data only.
- Escalate security or privacy concerns immediately.
- Do not request real patient examples for debugging.
- Confirm whether an issue is frontend, API, database, deployment, or training/documentation before assigning work.

## Production Monitoring Requirements Later

Before real production patient use:

- HTTPS and secure cookie/token review complete.
- Monitoring avoids PHI.
- Backup encryption and restore proof complete.
- Audit retention policy approved.
- Incident response owner and on-call process approved.
- Legal/privacy review complete.
