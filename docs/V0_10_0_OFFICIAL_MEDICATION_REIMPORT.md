# v0.10.0 Official Medication Re-Import

Branch: `data/v0.10.0-official-medication-reimport`

## Purpose

Earlier project history recorded 8,269 real official Bahrain/Oman medication reference rows, including 1,200 verified rows. v0.9.7, v0.9.8, and v0.9.9 confirmed that the current workspace has:

- Local DB official medication rows: 0.
- Verified medication rows: 0.
- No committed raw official export.
- No recoverable old DB/export artifact.

v0.10.0 prepares a safe re-import path from official public or owner-approved files. It does not create fake rows or AI-generated medication lists.

## Source Registry

Primary re-import targets:

- Bahrain NHRA, historical target 3,169 rows, status `needs re-import`.
- Oman MOH, historical target 5,100 rows, status `needs re-import`.

Future mappings are tracked for Egypt EDA, Saudi SFDA, UAE MOHAP/EDE, and Yemen in `docs/OFFICIAL_MEDICATION_SOURCE_REGISTRY.md`.

## Acquire Sources

List local acquired files:

```powershell
npm run medication:v100:source-list
```

Dry-run a local official file copy:

```powershell
npm run medication:v100:source-acquire -- --file PATH --source NHRA --country BH
```

Apply a reviewed local file copy into ignored storage:

```powershell
npm run medication:v100:source-acquire -- --file PATH --source NHRA --country BH --apply
```

URL acquisition is allowed only for public official files and refuses login, CAPTCHA, paywall, retail, stock, cart, checkout, purchase, and order URLs.

## Re-Import

Dry-run a reviewed official file:

```powershell
npm run medication:v100:reimport:dry-run -- --source NHRA --country BH --file PATH
```

Apply only in a local/dev/test/CI environment after a clean dry run:

```powershell
$env:APP_ENV="local"
npm run medication:v100:reimport:apply -- --source NHRA --country BH --file PATH
```

Rows default to `needs_review`. A row is preserved as `verified` only when the input file explicitly contains prior project `verificationStatus=verified`.

## Safety Rules

- No patient records, prescription directions, dose, frequency, duration, or instructions are imported.
- Strength/form/pack remains market metadata only.
- Existing verified rows are not silently overwritten when material metadata differs.
- Reports, manifests, raw source files, PDFs, spreadsheets, exports, and DB dumps remain ignored local artifacts under `storage/`.
- Do not claim strict medication readiness while official rows remain 0.

## Current Local Result

`npm run medication:v100:source-list` currently reports no acquired official files. No dry-run import was run against official data, no apply import was run, and no official rows were created.
