# Patient Import and Google Sheets

## v1.5.1 connected intake center

The live Patient Data Intake Center connects Google Form/Sheets submissions, CSV/XLSX staging, manual entry, submission history, import-batch history, corrections, and Owner Data Hygiene. Completed spreadsheet batches expose a constrained rollback: it deletes only patients created by that batch when PostgreSQL reports no dependent operational or clinical foreign-key records. Any dependency refuses the entire rollback, and a reason plus audit event is required.

File validation checks the extension and file signature, rejects binary CSV, rejects macro-bearing OOXML archives, limits uploads to 5 MB, 5,000 rows, 100 columns, and 10,000 characters per cell, and blocks formula-like values rather than evaluating them.

## Review defaults

Eligible unique rows default to `CONFIRM_CREATE` and selected. Exact normalized-phone matches default to `RESOLVE_EXISTING` and require attach, update, or separate-with-reason. Hard failures are `BLOCKED`. Skip is never a default, and reviewer selections/decisions persist in the staging batch.

Browser and CLI support CSV/XLSX with Arabic/English headers. Preview is count/review only and does not create episodes, queues, visits, appointments, prescriptions, or investigations. Google Sheets uses a timestamped HMAC signature, constant-time comparison, a five-minute replay window, rate limiting, idempotency, row hashes, a 25-row maximum, Unicode, and safe status responses. No real workbook was staged during this session.

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

Send at most 25 reviewed rows to `POST /external-intake/google-sheet` over HTTPS. Store the endpoint and secret in Apps Script Properties as `PRIJ_ENDPOINT` and `PRIJ_INTEGRATION_KEY`; never place the secret in a sheet or source file. Send `x-prij-integration-key`, a stable `idempotency-key`, an ISO `x-prij-timestamp`, and `x-prij-signature`. The signature is `sha256=` plus the lowercase HMAC-SHA256 hex digest of `timestamp + "." + idempotencyKey + "." + exactJsonBody`.

Example sender skeleton (staging only):

```javascript
function stageReviewedRows(rows, sheetId, idempotencyKey) {
  const properties = PropertiesService.getScriptProperties();
  const endpoint = properties.getProperty('PRIJ_ENDPOINT');
  const secret = properties.getProperty('PRIJ_INTEGRATION_KEY');
  if (!endpoint || !secret) throw new Error('Integration properties are not configured');
  const timestamp = new Date().toISOString();
  const body = JSON.stringify({ sheetId, rows });
  const canonical = timestamp + '.' + idempotencyKey + '.' + body;
  const bytes = Utilities.computeHmacSha256Signature(canonical, secret);
  const hex = bytes.map(value => ('0' + ((value < 0 ? value + 256 : value).toString(16))).slice(-2)).join('');
  return UrlFetchApp.fetch(endpoint.replace(/\/$/, '') + '/external-intake/google-sheet', {
    method: 'post', contentType: 'application/json', payload: body, muteHttpExceptions: true,
    headers: { 'x-prij-integration-key': secret, 'idempotency-key': idempotencyKey,
      'x-prij-timestamp': timestamp, 'x-prij-signature': 'sha256=' + hex }
  });
}
```

Each row contains `rowHash` (SHA-256), `sourceRow`, `mappedPatient`, and optional `sourceMetadata`. UTF-8 Arabic JSON is supported. Retry with the same idempotency key and row hashes. Only an exact normalized-phone match produces duplicate evidence; name, DOB, address, spouse name, patient type, and complaint never automatically match a patient. The response returns per-row staging IDs, replay state, and exact-phone-match state.

The endpoint creates staging submissions only. It never creates patients, phases, pregnancies, appointments, queue tickets, encounters, prescriptions, or investigations.
