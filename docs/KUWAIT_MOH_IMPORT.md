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

Status on 2026-06-30: failed. The official drug price PDF candidate fetch failed. No unofficial mirrors or fallback rows were used.
