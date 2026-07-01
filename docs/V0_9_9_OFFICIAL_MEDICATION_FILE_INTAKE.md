# v0.9.9 Official Medication File Intake + Restore Readiness

## Purpose

v0.9.9 adds an owner/admin workflow for official medication files after v0.9.8 found no approved local source/export candidates.

This sprint does not create medication rows, generate drug data, scrape retail pages, mark rows verified, add patient dosing instructions, add real patient data, call external AI, create a release tag, or commit uploaded files.

## Current Truth

- Demo patients are cleaned from the local/demo database baseline.
- v0.9.8 official medication candidates found: 0.
- Official medication rows: 0 until a local approved restore/import is applied.
- Verified medication rows: 0 until a source/export explicitly carries approved verification status.
- Medication restore has not been applied by this sprint.
- Prescription medication selection is not honestly testable until official rows exist.

## Inbox

Owner-provided files go here:

```powershell
storage/official-medication-inbox/
```

The folder is ignored except for `.gitkeep`. Do not commit PDFs, Excel files, JSON exports, ZIP files, backups, generated reports, storage contents, uploads, secrets, or local databases.

Supported scan extensions:

- `.json`
- `.jsonl`
- `.csv`
- `.xlsx`
- `.xls`
- `.zip`

## Commands

Scan metadata and headers only:

```powershell
npm run medication:v099:inbox-scan
```

Validate candidates using the v0.9.8 validator where applicable:

```powershell
npm run medication:v099:inbox-validate
npm run medication:v099:inbox-validate:strict
```

Dry-run restore from exactly one `RESTORE_READY` candidate:

```powershell
npm run medication:v099:restore-inbox:dry-run
```

Apply restore only after owner review, local/dev/test/CI environment confirmation, and explicit restore confirmation:

```powershell
$env:APP_ENV="local"
npm run medication:v099:restore-inbox:apply
```

Check readiness:

```powershell
npm run medication:v099:intake-ready
```

## Recommendations

- `RESTORE_READY`: likely compatible with the v0.9.7 official medication restore orchestrator. Dry-run before apply.
- `NEEDS_MAPPER`: may be an official source file, but needs a focused mapper/import sprint before rows can be imported.
- `UNSUPPORTED`: not imported by v0.9.9 tooling.
- `NOT_MEDICATION_DATA`: ignore for medication restore.

## Verification After Apply

The apply wrapper runs:

```powershell
npm run medication:v097:ready-check:strict
npm run prescriptions:v097:medication-selection-check
```

Prescription selection remains blocked until official rows exist.
