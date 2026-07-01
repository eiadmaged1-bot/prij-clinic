# Official Medication Restore Drill

Status for v0.8.6:
- Main local DB real official rows before drill: 8,269.
- Restore-test DB: `prij_clinic_medication_restore_test`.
- Latest isolated restore drill status: passed.
- Restored real official rows: 8,269.
- Restored Bahrain rows: 3,169.
- Restored Oman rows: 5,100.
- Restored verified rows after batch 4: 1,200.
- Restored Bahrain verified rows after batch 4: 600.
- Restored Oman verified rows after batch 4: 600.
- Demo rows remain excluded from real export/restore coverage: 23 excluded in the manifest, 0 demo rows imported into the restore-test database.

Commands:

```powershell
npm run medication:official-data:export
npm run medication:official-data:verify-export
npm run medication:official-data:restore-drill -- --latest
```

The restore drill uses `MEDICATION_RESTORE_DATABASE_URL` when set. Without it, the script derives `prij_clinic_medication_restore_test` from the local `DATABASE_URL`. It refuses to use the main `DATABASE_URL` by default.

The restore drill applies migrations to the isolated restore-test database, imports the verified export, compares restored counts against the export manifest, and writes a local report under ignored `storage/official-medication-restore-drills/`.

Exports and restore reports are local operational artifacts only. They are ignored and must not be committed.

Safety rules:
- No main database reset, drop, truncate, or overwrite.
- No patient records in official medication exports.
- No raw source files, environment files, secrets, backups, or storage files in commits.
- No fake fallback rows.
- Medication data remains market/reference metadata only.
- Strength, form, pack, and official/source price are not patient dosing instructions.
- Doctor approval remains mandatory for clinical use.
