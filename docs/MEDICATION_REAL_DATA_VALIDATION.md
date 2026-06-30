# Medication Real Data Validation

Validation rules:
- Real variants must have country, trade or generic name, source/import metadata, and review status.
- Price metadata must have source context and currency when known.
- Demo rows are excluded from real counts.
- No patient dosing instructions or stock/order/checkout fields are allowed.
- No source can be marked complete with zero real rows.
- Verified rows are not silently overwritten by imports; conflicts go to review.

Run:

```powershell
npm run medication:validate:official
```

