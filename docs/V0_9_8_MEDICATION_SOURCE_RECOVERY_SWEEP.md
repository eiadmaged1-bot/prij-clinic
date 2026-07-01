# v0.9.8 Medication Source Recovery Sweep

## Purpose

Recover missing approved official medication source/export files so medication browsing and prescription selection can be tested honestly.

This sweep does not create medication rows, import files, scrape retail sources, or mark unverified rows as verified. It only finds and classifies local candidate files by metadata, filenames, headers, and safe bounded samples.

## Commands

Run the wide local source sweep:

```powershell
npm run medication:v098:sweep-sources
```

Validate one candidate:

```powershell
npm run medication:v098:validate-candidate -- --file "PATH"
```

Run the unit test for the recovery classifier:

```powershell
npm run test:v098:source-sweep
```

## Reports

The sweep writes:

- `storage/medication-source-recovery/v098-wide-source-sweep-report.json`
- `storage/medication-source-recovery/v098-wide-source-sweep-report.md`

These reports are intentionally ignored local artifacts and must not be committed. They include file paths, extension, file size, modified time, keyword matches, likely country/source, confidence, verification-status signal, artifact type, and sampled headers only.

## Candidate Decisions

`RESTORE_READY` means the file appears compatible with the v0.9.7 official medication restore orchestrator. Dry-run first:

```powershell
$env:APP_ENV="local"
node scripts/v097-restore-official-medications.mjs --file "PATH"
```

Apply only if it is clearly a previous approved official export:

```powershell
$env:APP_ENV="local"
node scripts/v097-restore-official-medications.mjs --file "PATH" --apply --confirm RESTORE_OFFICIAL_MEDICATION_REFERENCE_DATA
npm run medication:v097:ready-check:strict
npm run prescriptions:v097:medication-selection-check
```

`NEEDS_MAPPER` means the file may be an official source or previous app data, but the existing restore orchestrator does not directly support it. Add a focused parser/mapping sprint before import.

`DB_BACKUP_RESTORE_REQUIRED` means the file looks like a SQL dump or database backup. Do not restore it into the current local database. Create an isolated restore database, inspect and export only official medication reference rows, then import into the current database through the approved restore/import path.

`UNSUPPORTED` means the file must not be imported by v0.9.8 tooling.

`NOT_MEDICATION_DATA` means the file should be ignored for this recovery.

## Current Baseline

The Stage 2 baseline before this sweep was:

- `db:v095:audit` PASS
- patients: 0
- all patient-linked operational rows: 0
- investigation catalog: 63
- service catalog: 68
- clinical protocols: 442
- guideline sources: 52
- guideline documents: 43
- `eyad` protected active Owner
- audit logs preserved: 14799 rows
- `V096-READY SUMMARY PASS 9 WARN 1 FAIL 0`
- only warning: official medication rows absent locally

If the sweep finds no approved local source/export, the remaining blocker is owner-provided official files or a previous approved official medication export. No fake medication rows should be created.

## Stage 5 Sweep Result

The wide sweep checked the configured local project and user paths and found no approved local official medication source/export candidates.

No candidate validation was run because there were no candidates. No medication restore was applied. Medication browsing and prescription medication selection remain blocked on owner-provided official source files or a previous approved official medication export.
