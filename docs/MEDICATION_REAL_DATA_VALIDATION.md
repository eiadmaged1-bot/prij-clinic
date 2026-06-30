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
