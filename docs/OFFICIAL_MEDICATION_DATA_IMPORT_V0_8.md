# Official Medication Data Import v0.8

Goal: move the Medication Intelligence Engine v2 drug-market framework from demo-only rows toward official-source medication/product/variant/price metadata for Egypt and GCC countries.

Safety boundaries:
- Medication data is reference metadata only.
- No patient self-medication guidance.
- No patient dosing instructions.
- No auto-prescribing, auto-dose changes, or prescription signing.
- Imported rows are `needs_review` or `imported` until an authorized admin/owner verifies them.
- Demo rows are marked `isDemo=true` and excluded from real coverage/search by default.

Commands:

```powershell
npm run medication:sources:discover
npm run medication:import:official -- --country KSA --source SFDA_DRUGS_LIST --mode live
npm run medication:import:official -- --country EG --source EDA_OFFICIAL_FILE_UPLOAD --mode upload-required --file path\to\official.csv
npm run medication:validate:official
npm run medication:coverage:report
npm run medication:sources:freshness
```

CSV and JSON official uploads are supported now. XLSX/PDF sources are tracked and safely reported, but require an approved parser path or official conversion before import in this implementation.

