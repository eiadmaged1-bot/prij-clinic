# Medication Real Data Validation

Run:

```powershell
npm run medication:validate:official
```

Validation rules:
- Real variants must have country, trade or generic name, source/import metadata, review status, and row hash where possible.
- Price metadata must retain source context and currency when known.
- Demo rows are excluded from real counts.
- No country/source may be marked complete with 0 real rows.
- No patient dosing instructions, how-to-take text, stock, order, checkout, purchase, or live pharmacy wording.
- Verified rows are not overwritten silently; conflicts go to review.

Current result on 2026-06-30: 3,169 real Bahrain rows passed validation; 23 demo rows excluded.
# v0.8.2 Real Data Validation Notes

Commands:

```powershell
npm run medication:validate:official
npm run medication:coverage:report
npm run medication:review:summary
npm run test:official-medications:gcc
npm run test:drug-market:review
```

Validated on 2026-06-30:
- Real official rows: 8,269.
- Demo rows excluded: 23.
- Bahrain NHRA rows: 3,169.
- Oman MOH rows: 5,100.
- Open official review items: 8,269.
- Verified/rejected/retired rows: 0/0/0.

Validation rejects fake fallback rows, real rows without source/import metadata, price metadata without currency, and unsafe dosing or purchase wording.
