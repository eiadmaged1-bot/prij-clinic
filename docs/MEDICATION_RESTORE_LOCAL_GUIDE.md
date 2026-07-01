# Medication Restore Local Guide

Official medication data must come from a previous approved export or owner-provided official source file. Do not create fake real medication data.

## v0.10.0 Official Source Re-Import

v0.10.0 adds a guarded path for re-importing official/public or owner-approved Bahrain NHRA and Oman MOH source files after v0.9.7-v0.9.9 found no recoverable old export or DB artifact.

List acquired local source files:

```powershell
npm run medication:v100:source-list
```

Acquire a reviewed official file into ignored local storage:

```powershell
npm run medication:v100:source-acquire -- --file PATH --source NHRA --country BH --apply
```

Dry-run re-import:

```powershell
npm run medication:v100:reimport:dry-run -- --source NHRA --country BH --file PATH
```

Apply only after a clean dry run:

```powershell
$env:APP_ENV="local"
npm run medication:v100:reimport:apply -- --source NHRA --country BH --file PATH
```

All imported rows default to `needs_review` unless the file explicitly carries prior project `verificationStatus=verified`. No dosing instructions, frequency, duration, patient instructions, stock/order/checkout data, or patient records are imported.

Find local candidates:

```powershell
npm run medication:v097:find-sources
```

Dry-run the newest previous export:

```powershell
npm run medication:v097:restore:dry-run
```

Apply restore only in local/dev/test/CI demo environments:

```powershell
$env:APP_ENV="local"
npm run medication:v097:restore:apply
```

Restore rules:
- `verified` rows are restored as `verified` only when the export already contains that status.
- Missing or non-verified statuses are restored as `needs_review`.
- Existing verified rows are not silently overwritten if material metadata differs.
- No patient records, prescriptions, dose instructions, stock, orders, or checkout data are created.

Verify:

```powershell
npm run medication:v097:ready-check
npm run medication:v097:ready-check:strict
```

If no approved export exists, `docs/V0_9_7_MISSING_MEDICATION_SOURCE_REPORT.md` explains the blocker.

## v0.9.9 Provenance Recovery

Run the project-artifact recovery scan:

```powershell
npm run medication:v099:provenance
```

If an isolated old recovery DB is found with official rows, dry-run export first:

```powershell
npm run medication:v099:export-from-recovery-db -- -ContainerName OLD_RECOVERY_CONTAINER -User DB_USER -Database DB_NAME
```

Export requires explicit confirmation and writes only ignored local reference data:

```powershell
npm run medication:v099:export-from-recovery-db -- -ContainerName OLD_RECOVERY_CONTAINER -User DB_USER -Database DB_NAME -Export -ConfirmOfficialMedicationExport
```

Then validate and import only through the guarded recovered import workflow:

```powershell
npm run medication:v098:validate-candidate -- --file "storage/medication-provenance-recovery/official-medication-recovered.jsonl"
npm run medication:v099:import-recovered:dry-run
$env:APP_ENV="local"
npm run medication:v099:import-recovered:apply
```

Never restore an old backup directly over the current DB.
