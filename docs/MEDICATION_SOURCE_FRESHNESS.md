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
