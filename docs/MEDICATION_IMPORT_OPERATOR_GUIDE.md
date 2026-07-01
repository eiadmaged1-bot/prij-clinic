# Medication Import Operator Guide

Use this guide only for authorized official medication registry/source files.

## Current Blocker

The previous project medication artifact is unavailable. Current project artifacts cannot recover the old official rows. Do not fill the gap with fake data or generated medication lists.

## Inbox

Place authorized official files here:

```powershell
storage/official-medication-sources/
```

Accepted file types: CSV, XLSX, XLS, JSON, JSONL, ZIP.

## Commands

Check status:

```powershell
npm run medication:v101:import-status
```

Scan inbox:

```powershell
npm run medication:v101:operator -- -Scan
```

Dry-run mapping:

```powershell
npm run medication:v101:operator -- -DryRun -Source NHRA -Country BH -File "PATH"
```

Apply after review:

```powershell
$env:APP_ENV="local"
npm run medication:v101:operator -- -Apply -ConfirmApply -Source NHRA -Country BH -File "PATH"
```

Verify:

```powershell
npm run medication:v097:ready-check:strict
npm run prescriptions:v097:medication-selection-check
```

## Rules

- Official rows remain 0 until authorized files are added and applied.
- Imported rows default to `needs_review`.
- Strength, form, and pack are market metadata only.
- Doctor directions are manually written.
- Prescription selection is not testable while official rows are 0.
- Do not use fake data, stock/order/checkout sources, dosing automation, or real patient data.
