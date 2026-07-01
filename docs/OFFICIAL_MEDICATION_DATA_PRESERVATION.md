# Official Medication Data Preservation

Status after v0.8.6 Batch 4 and restore drill:
- Real official rows preserved: 8,269.
- Bahrain NHRA rows: 3,169.
- Oman MOH rows: 5,100.
- Demo rows excluded by default: 23.
- Verified rows after batch 4: 1,200.
- Bahrain verified rows after batch 4: 600.
- Oman verified rows after batch 4: 600.
- Open review items after batch 4: 7,069.
- High-confidence candidates remaining after batch 4: 6,998.
- Low-confidence blocked Oman rows: 71.

Local disaster-recovery commands:

```powershell
npm run medication:official-data:export
npm run medication:official-data:verify-export
npm run medication:official-data:restore-drill -- --latest
npm run medication:official-data:import -- --file "storage/official-medication-exports/<file>.jsonl"
```

Exports are written to ignored `storage/official-medication-exports/`. Restore drill reports are written to ignored `storage/official-medication-restore-drills/`. They include official medication market/reference metadata, source snapshots, row hashes, parser confidence, official/source price metadata, import runs, review queue items, merge candidates when present, and verification statuses. They exclude patient data, secrets, raw downloaded files, and demo rows unless `--include-demo true` is passed.

Restore defaults to dry-run. Use `--dry-run false` only for an intentional local restore. Verified rows are not overwritten silently; material conflicts create review items.

The restore drill uses a separate restore-test database, `prij_clinic_medication_restore_test`, and refuses the main `DATABASE_URL` by default. It applies migrations to the restore-test database, imports the official medication export, compares restored counts against the export manifest, and fails on mismatches.

Current source limitations:
- Qatar MOPH: public source recovery remains failed safely; owner-provided official upload is available.
- Kuwait MOH: public source recovery remains failed safely; owner-provided official upload is available.
- Saudi SFDA: public source recovery remains failed safely; owner-provided official upload is available.
- Egypt EDA: official file upload plus targeted lookup only; no bulk enumeration.
- UAE MOHAP: approved API access or official upload only.
