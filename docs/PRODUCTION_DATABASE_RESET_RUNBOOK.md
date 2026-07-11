# Production Database Reset Runbook

This runbook is for the launch reset before real clinic data is entered. Do not use it for routine operations.

## Allowed During This Sprint

- Inventory may run.
- Backup validation may run.
- Reset plan may run.
- Verification may run.
- Restore drill may run only against an isolated temporary database.

## Forbidden During This Sprint

- Do not run `npm run db:production-launch:apply`.
- Do not run `prisma migrate reset`.
- Do not run `prisma db push --force-reset`.
- Do not drop the database or schema.

## Dry-Run Commands

```powershell
npm run db:production-launch:inventory
npm run db:production-launch:plan
npm run db:production-launch:verify
```

## Backup Command

```powershell
$env:PRODUCTION_LAUNCH_DATABASE_FINGERPRINT="<fingerprint-from-plan>"
npm run db:production-launch:backup
```

The backup manifest must be outside the Git source tree. Generated backup files must never be committed.

## Apply Command Template

The reset plan prints an apply command with the exact confirm value:

```powershell
npm run db:production-launch:apply -- --plan "<plan-json-path>" --backup-manifest "<backup-manifest-json>" --confirm <confirm-value> --apply
```

Do not execute that command in this sprint.

## Apply Refusal Gates

Apply refuses when:

- `--apply` is absent.
- The backup manifest is absent.
- Database or uploaded-file backup paths are absent.
- Backup paths are not absolute or are inside the source tree.
- The backup manifest fingerprint does not match the plan.
- The current database fingerprint does not match the plan.
- The plan hash does not match plan contents.
- The exact confirm value is wrong.
- Uncertain records remain unresolved.
- Production users or branches would be deleted.
- Verified catalogs would be deleted.

## Preserved Data Classes

- Migrations and schema.
- Branches and clinic settings.
- Approved users, roles, permissions, and audit logs.
- Verified medications, investigations, operations, clinical tags, calculators, protocols, service catalog, and production settings.

## Cleanup Data Classes

- Patient-linked operational records.
- Queue, visit, prescription, investigation, report, document, billing, payment, intake, consent record, referral, task, internal note, AI draft, staff chat, infertility, pregnancy, ultrasound, and patient-linked medication/allergy records.
- Demo/test/placeholder prescription templates and medication shortcuts when not reviewed production configuration.

