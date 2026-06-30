# Kuwait MOH Import

Command:

```powershell
npm run medication:import:kuwait -- --source KUWAIT_MOH_DRUG_PRICE_LIST --mode dry-run
npm run medication:import:kuwait -- --source KUWAIT_MOH_DRUG_PRICE_LIST --mode live
npm run medication:import:kuwait -- --source KUWAIT_MOH_FOOD_SUPPLEMENT_PRICE_LIST --mode live
```

Status on 2026-06-30: blocked/source unavailable.

The configured official Kuwait MOH PDF candidate failed to fetch. The importer did not use unofficial mirrors and did not create fallback rows.

PDF parsing remains conservative: high-confidence rows can be imported, low-confidence lines are routed to review, and no row is verified automatically.
