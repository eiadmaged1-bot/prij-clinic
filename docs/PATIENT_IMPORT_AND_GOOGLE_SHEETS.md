# Patient Import and Google Sheets

## v1.5.0 review defaults

Eligible unique rows default to `CONFIRM_CREATE` and selected. Exact normalized-phone matches default to `RESOLVE_EXISTING` and require attach, update, or separate-with-reason. Hard failures are `BLOCKED`. Skip is never a default, and reviewer selections/decisions persist in the staging batch.

Browser and CLI support CSV/XLSX with Arabic/English headers. Preview is count/review only and does not create episodes, queues, visits, appointments, prescriptions, or investigations. Google Sheets uses constant-time integration-key comparison, rate limiting, idempotency, row hashes, a 25-row maximum, Unicode, and safe status responses. No real workbook was staged during this session.

Patient imports are staging-first. CSV/XLSX files are read as displayed values with formula evaluation disabled, limited to 5 MB and 5,000 rows, and never committed to Git. Eligible nonduplicate rows default to `CONFIRM_CREATE` with `selected=true`; `Skip` is only an explicit reviewer choice. Exact normalized-phone matches default to `RESOLVE_EXISTING` and require `ATTACH_EXISTING`, `UPDATE_EXISTING`, or `CREATE_SEPARATE_WITH_REASON`. Validation failures are `BLOCKED`.

Historical mappings use structured patient fields for address, spouse name, secondary phone, external paper-file number, original registration date, import source/batch, verification state, warnings, and source row metadata.

## Local operator command

```powershell
npm run patient-import -- --file "C:\path\outside\repository\patients.xlsx" --dry-run
$env:PRIJ_API_ORIGIN="https://clinic.example"
$env:PRIJ_OPERATOR_TOKEN="<short-lived operator token>"
npm run patient-import -- --file "C:\path\outside\repository\patients.xlsx" --stage
```

Dry-run prints counts only. Stage sends rows to review and never creates patients directly.

## Google Sheets Apps Script contract

Send at most 25 reviewed rows to `POST /external-intake/google-sheet` over HTTPS with `x-prij-integration-key` and a stable `idempotency-key`. The server-side integration key must be stored as `PRIJ_GOOGLE_SHEETS_INTEGRATION_KEY`; do not place it in the sheet. Each row contains `rowHash` (SHA-256), `sourceRow`, `mappedPatient`, and optional `sourceMetadata`. UTF-8 Arabic JSON is supported. Retry with the same idempotency key and row hashes. The response returns per-row staging IDs and duplicate flags for status tracking.

The endpoint creates staging submissions only. It never creates patients, phases, pregnancies, appointments, queue tickets, encounters, prescriptions, or investigations.
