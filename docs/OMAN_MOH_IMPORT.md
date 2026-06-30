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

Result on 2026-06-30:
- Rows imported: 5,100.
- Rows needing review: 5,100.
- Open review items: 5,100.
- Currency default: OMR when price is present.

The PDF parser is conservative and review-gated. Rows must be verified by Admin/Owner with a reason before being treated as verified reference metadata.
