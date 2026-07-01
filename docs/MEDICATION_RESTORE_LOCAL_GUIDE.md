# Medication Restore Local Guide

Official medication data must come from a previous approved export or owner-provided official source file. Do not create fake real medication data.

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
