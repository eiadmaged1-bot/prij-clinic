# Medication Source Recovery Playbook

## Rules

- Do not create fake medication data.
- Do not generate medication rows from memory.
- Do not mark unverified rows as verified.
- Do not scrape retail, checkout, stock, cart, or order sources.
- Do not import raw files automatically.
- Do not add patient dosing instructions.
- Do not commit raw medication files, storage reports, uploads, backups, PDFs, Excel files, generated reports, or secrets.

## 1. Sweep Local Sources

```powershell
npm run medication:v098:sweep-sources
```

Read:

- `storage/medication-source-recovery/v098-wide-source-sweep-report.md`
- `storage/medication-source-recovery/v098-wide-source-sweep-report.json`

Prioritize high-confidence candidates marked as previous app export, then medium-confidence raw official source files.

## 2. Validate Candidate

```powershell
npm run medication:v098:validate-candidate -- --file "PATH"
```

The validator is dry-run only. It estimates total rows, likely non-demo rows, countries/sources, verification statuses when present, duplicate-risk fields, and whether the v0.9.7 restore orchestrator likely supports the file.

## 3. Restore Decision

### RESTORE_READY

Dry-run first:

```powershell
$env:APP_ENV="local"
node scripts/v097-restore-official-medications.mjs --file "PATH"
```

Apply only after confirming it is a previous approved official medication export:

```powershell
$env:APP_ENV="local"
node scripts/v097-restore-official-medications.mjs --file "PATH" --apply --confirm RESTORE_OFFICIAL_MEDICATION_REFERENCE_DATA
npm run medication:v097:ready-check:strict
npm run prescriptions:v097:medication-selection-check
```

### NEEDS_MAPPER

Create a parser/mapping sprint. The mapper must preserve official source identity, registration numbers, row hashes when possible, country/source fields, and verification status. It must not infer clinical claims or dosing instructions.

### DB_BACKUP_RESTORE_REQUIRED

Create an isolated restore database, restore the backup there, export only approved official medication reference rows, verify the export, then import into the current local database. Do not restore the backup over the current database.

### UNSUPPORTED

Do not import. Record why it is unsupported and request a supported official export or a mapping sprint.

### No Candidate Found

Document that no local approved official medication source/export was found after the wide sweep. The owner must provide official files or a previous approved official export before medication browsing and prescription selection can be tested honestly.
