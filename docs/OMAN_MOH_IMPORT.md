# Oman MOH Import

Commands:

```powershell
npm run medication:import:oman -- --mode dry-run
npm run medication:import:oman -- --mode live
npm run medication:import:official -- --country OMN --source OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES --mode live
```

Active public source:
- `OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES`
- Official page: Oman MOH Drug Safety Center.
- Imported file label: `Pharmaceutical Products List With Prices 11 05 2026`.
- File SHA-256: `ae9e43c25154587b8acbf62073c6b42760477dfc3b9455c95bb4a952a52e73e4`.

Result after v0.8.4 batch 2 on 2026-06-30:
- Rows imported: 5,100.
- Rows verified: 100.
- Rows needing review: 5,000.
- Open review items: 5,000.
- Currency default: OMR when price is present.
- Parser confidence improved from all 5,100 rows below 0.60 to 5,041 rows at or above 0.60.
- High-confidence candidates before batch 2 verification: 5,029.

The PDF parser is conservative and review-gated. Rows must be verified by Admin/Owner with a reason before being treated as verified reference metadata.
Low-confidence rows, duplicate-risk rows, and rows missing defensible structured fields remain blocked from batch verification.

See `docs/OFFICIAL_MEDICATION_VERIFICATION_BATCH_2_OMAN.md`.
