# v0.10.1 Official Medication Import Operator

Branch: `data/v0.10.1-official-medication-import-operator`

## Purpose

The old project medication artifact is unavailable and cannot be recovered from current project artifacts. v0.10.1 prepares a guided, owner/admin-operated import session for authorized official medication registry/source files.

This sprint does not create medication rows by itself. Official rows remain 0 until authorized official files are added and an apply import is explicitly run.

## Safety

- No fake medication rows.
- No medication data generated from memory.
- No retail, stock, cart, checkout, order, or pharmacy source scraping.
- No login, CAPTCHA, paywall, or anti-bot bypass.
- No patient dosing instructions.
- No auto-prescribing.
- No real patient data.
- No external AI.
- No release tag.

Imported medication data is reference/market metadata only. Strength, form, and pack are not a patient dose. The doctor manually writes patient directions.

## Operator Flow

Local inbox:

```powershell
storage/official-medication-sources/
```

Accepted inbox file types: CSV, XLSX, XLS, JSON, JSONL, ZIP. ZIP files must be reviewed or extracted before v100 reimport can parse them.

Scan:

```powershell
npm run medication:v101:operator -- -Scan
```

Dry run:

```powershell
npm run medication:v101:operator -- -DryRun -Source NHRA -Country BH -File "PATH"
```

Apply, local/dev/test/CI only:

```powershell
$env:APP_ENV="local"
npm run medication:v101:operator -- -Apply -ConfirmApply -Source NHRA -Country BH -File "PATH"
```

Verify:

```powershell
npm run medication:v097:ready-check:strict
npm run prescriptions:v097:medication-selection-check
```

Prescription medication selection remains blocked until verified or needs_review official rows exist.
