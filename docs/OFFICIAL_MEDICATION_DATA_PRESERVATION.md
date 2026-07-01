# Official Medication Data Preservation

Status after v0.8.5 Batch 3:
- Real official rows preserved: 8,269.
- Bahrain NHRA rows: 3,169.
- Oman MOH rows: 5,100.
- Demo rows excluded by default: 23.
- Verified rows after batch 3: 600.
- Open review items after batch 3: 7,669.

Local disaster-recovery commands:

```powershell
npm run medication:official-data:export
npm run medication:official-data:verify-export
npm run medication:official-data:import -- --file "storage/official-medication-exports/<file>.jsonl"
```

Exports are written to ignored `storage/official-medication-exports/`. They include official medication market/reference metadata, source snapshots, row hashes, import runs, review queue items, merge candidates when present, and verification statuses. They exclude patient data, secrets, raw downloaded files, and demo rows unless `--include-demo true` is passed.

Restore defaults to dry-run. Use `--dry-run false` only for an intentional local restore. Verified rows are not overwritten silently; material conflicts create review items.

