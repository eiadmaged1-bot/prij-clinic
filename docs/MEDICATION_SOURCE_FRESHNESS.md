# Medication Source Freshness

Source freshness fields:
- `lastCheckedAt`
- `lastSuccessfulImportAt`
- `latestSourcePublishedAt`
- `latestSourceLabel`
- `sourceFreshnessStatus`
- `coverageStatus`

Run:

```powershell
npm run medication:sources:freshness
npm run medication:coverage:report
```

v0.8.1 records final source URL, content type, last-modified header when present, fetched time, file SHA-256, import run ID, and source snapshot metadata.
# v0.8.2 Source Freshness Notes

Command:

```powershell
npm run medication:sources:freshness
```

Current real-source freshness on 2026-06-30:
- BHR Bahrain NHRA registered medicine price list: current checked today, 3,169 real rows.
- OMN Oman MOH registered pharmaceutical products with prices: current checked today, 5,100 real rows.
- QAT Qatar MOPH: failed, official HTML did not expose supported XLSX.
- KWT Kuwait MOH: failed, official PDF candidate fetch failed.
- KSA Saudi SFDA: failed, public HTML timed out or was not safely parseable.
- EG Egypt EDA: official file upload or targeted lookup only.

Source freshness reports must keep demo rows excluded and must show source file hashes for file-based successful imports.
