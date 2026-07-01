# Medication Source Freshness

Run:

```powershell
npm run medication:sources:freshness
npm run medication:coverage:report
```

Batch 3 freshness status:
- Bahrain NHRA registered medicine price list: `current_checked_today`.
- Oman MOH registered pharmaceutical products with prices: `current_checked_today`.
- Qatar MOPH: `failed`; official HTML did not expose a supported visible XLSX/source-file link.
- Kuwait MOH: `failed`; official PDF candidate fetch failed.
- Saudi SFDA: `failed`; public HTML did not expose a parseable server-rendered table in the dry diagnostic.
- Egypt EDA: official file upload and targeted lookup only.
- UAE MOHAP: gated/API approval or official upload required.

File-based successful imports retain source file hashes in import runs and source snapshots. Raw official files remain ignored and must not be committed.
