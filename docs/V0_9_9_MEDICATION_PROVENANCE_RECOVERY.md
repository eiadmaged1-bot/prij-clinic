# v0.9.9 Medication Provenance Recovery

Branch: `data/v0.9.9-medication-provenance-recovery`

## Purpose

Recover prior official medication data from project-owned artifacts before asking the owner for a new export.

Historical project status recorded:

- Bahrain NHRA: 3,169 real official rows
- Oman MOH: 5,100 real official rows
- Total official real rows: 8,269
- Verified official rows at one point: 1,200

Current local baseline before this sprint:

- Official medication rows: 0
- Verified medication rows: 0

## Tooling Added

- `npm run medication:v099:provenance`
  - Read-only provenance scan.
  - Searches Git refs/history, local repo copies, ignored storage report paths, Docker containers, Docker volumes, and current DB readiness output.
  - Writes ignored reports under `storage/medication-provenance-recovery/`.
- `npm run medication:v099:export-from-recovery-db`
  - Dry-run by default.
  - Exports only medication reference tables when `-Export -ConfirmOfficialMedicationExport` are explicitly provided.
- `npm run medication:v099:import-recovered:dry-run`
  - Dry-run recovered export import.
- `npm run medication:v099:import-recovered:apply`
  - Requires `APP_ENV=local|dev|test|ci` and `--confirm IMPORT_RECOVERED_OFFICIAL_MEDICATIONS`.

## Search Result

The provenance scan found medication-related branches, tags, scripts, and documentation, including the historical v0.8.5 and v0.8.6 medication preservation/restore refs. It did not find a committed raw official export file or recoverable raw medication dataset.

Local worktrees and repo copies searched:

- `C:\Newfolder\prij-clinic`
- `C:\Newfolder\prij-clinic-ai-mega`
- `C:\Newfolder\prij-clinic-calculators`
- `C:\Newfolder\prij-clinic-finance`
- `C:\Newfolder\prij-clinic-guidelines`
- `C:\Newfolder\prij-clinic-gyn`
- `C:\Newfolder\prij-clinic-integration-v05`
- `C:\Newfolder\prij-clinic-next-leap-planning`
- `C:\Users\SuperUser`

Docker inspection found the current `prij-clinic-postgres` container and six project Postgres volumes. The running current DB reported:

- `DrugMarketVariant total`: 15
- Official non-demo variants: 0
- Verified official variants: 0
- Needs-review official variants: 0

No old running Postgres container with official rows was found. Docker volume metadata was recorded, but volumes were not attached to a new database server because that can mutate Postgres recovery state.

## Decision

No recovered export was created and no import was applied.

The previous official medication data was likely stored in an ignored local export, old local DB state, or restore-drill artifact that is not currently available in this workspace. The remaining blocker is a missing previous export/old DB artifact, not a mapping or validation problem.

No fake medication rows were created. No unverified rows were marked verified. No patient, prescription, dosing, stock, checkout, secret, or real patient data was exported or imported.
