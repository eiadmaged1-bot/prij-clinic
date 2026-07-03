# v0.10.9 Legacy Queue Duplicate Remediation

The `20260703143000_schema_integrity_hardening` migration is intentionally guarded. It refuses to add the new daily queue uniqueness constraint while legacy rows still duplicate the same `branchId + UTC checkedInAt date + queueNumber`.

## Blocked Duplicate

- Branch: `ada31369-d91e-4071-9de3-865268722c74`
- UTC date: `2026-07-03`
- Queue number: `1`
- Ticket IDs:
  - `9fb69f14-399a-41d9-b944-d88991e16bee`
  - `61cbcf2e-136f-4d2f-8a3b-014dac6ece3b`

## Remediation Rule

- No queue tickets are deleted.
- No database reset, table drop, truncate, or broad renumbering is performed.
- The earliest ticket in each duplicate group is preserved unchanged.
- Only later duplicate tickets are reassigned.
- Reassigned tickets receive the smallest positive queue number not already used for the same branch and UTC date.
- `checkedInAt`, patient links, appointment links, and status are preserved.
- UTC date logic matches the migration guard: `("checkedInAt" AT TIME ZONE 'UTC')::date`.

## Environment Safety

`--apply` is allowed only when `APP_ENV` or `NODE_ENV` is one of:

- `local`
- `dev`
- `development`
- `test`

Staging and production must be manually reviewed and remediated with an approved operational plan. This script is for local/dev/test remediation only.

## Commands

Dry-run first:

```powershell
npm run db:v109:queue-duplicates:dry-run
```

Apply locally only after reviewing the exact planned changes:

```powershell
$env:APP_ENV="local"
npm run db:v109:queue-duplicates:apply
```

Verify migration readiness:

```powershell
npm run db:v109:queue-migration-ready
```

Then apply the guarded schema migration:

```powershell
npm run prisma:migrate:deploy
npm run prisma:generate
npm run prisma:seed
```

## Audit

When the local `AuditLog` table exposes the expected raw SQL columns, apply mode inserts a non-PHI audit row per changed ticket:

- `action`: `queue.legacy_duplicate_resolved`
- `resourceType`: `QueueTicket`
- `resourceId`: changed ticket ID
- `metadataJson`: old queue number, new queue number, branch ID, UTC date, and remediation reason

If an older local schema lacks compatible audit columns, remediation should not fail only because audit insertion is unavailable.
