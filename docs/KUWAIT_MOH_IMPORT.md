# Kuwait MOH Import

Commands:

```powershell
npm run medication:import:kuwait -- --source KUWAIT_MOH_DRUG_PRICE_LIST --mode dry-run
npm run medication:import:kuwait -- --source KUWAIT_MOH_DRUG_PRICE_LIST --mode live
npm run medication:import:kuwait -- --source KUWAIT_MOH_FOOD_SUPPLEMENT_PRICE_LIST --mode live
```

v0.8.2 behavior:
- Uses official MOH domain candidates only.
- Accepts PDF content type or PDF magic header.
- Extracts text with `pdf-parse` when an official PDF is accessible.
- Routes all imported rows to review.

Status on 2026-07-01: failed safely. The official drug price PDF candidate fetch failed; diagnostics record HTTP/fetch failure details where available. No unofficial mirrors or fallback rows were used.

Owner intake:

```powershell
npm run medication:import:official -- --country KWT --source KUWAIT_OFFICIAL_FILE_UPLOAD --mode upload-required --file "C:\Path\To\official-kuwait-file.pdf"
```

Use official or licensed Kuwait MOH files only. PDF is accepted only where a parser exists or a controlled text extraction path is available.
