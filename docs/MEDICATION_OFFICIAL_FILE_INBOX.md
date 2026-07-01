# Medication Official File Inbox

## Owner Workflow

1. Place owner-provided official medication source files or prior approved app exports in `storage/official-medication-inbox/`.
2. Run `npm run medication:v099:inbox-scan`.
3. Run `npm run medication:v099:inbox-validate`.
4. If exactly one candidate is `RESTORE_READY`, run `npm run medication:v099:restore-inbox:dry-run`.
5. Review the dry-run output.
6. Apply only in local/dev/test/CI with:

```powershell
$env:APP_ENV="local"
npm run medication:v099:restore-inbox:apply
```

7. Verify readiness with `npm run medication:v099:intake-ready`.

## Boundaries

- The scanner prints paths, size, modified time, extension, likely source/country, headers, detected columns, and recommendation only.
- It does not import rows.
- It does not dump full records.
- It does not print secrets intentionally.
- It does not mark rows verified unless a prior approved export explicitly contains verification status and the v0.9.7 restore orchestrator accepts it.
- Raw official files remain local ignored artifacts.

## Blocked Cases

Raw official source files that return `NEEDS_MAPPER` require a separate mapper sprint before import. ZIP files are treated as unsupported containers until reviewed. Database backups must be restored only into an isolated database, then exported through an approved official medication export path.
