# Medication Real Data Validation

Run:

```powershell
npm run medication:validate:official
npm run medication:coverage:report
npm run medication:review:summary
```

Current v0.8.5 Batch 3 result:
- Real official rows: 8,269.
- Bahrain NHRA rows: 3,169.
- Oman MOH rows: 5,100.
- Demo rows excluded: 23.
- Verified rows: 600.
- Bahrain verified rows: 300.
- Oman verified rows: 300.
- Remaining needs-review rows: 7,669.
- Rejected/retired rows: 0/0.

Validation rules:
- Real rows must retain country, trade or generic name, source/import metadata, review status, and row hash where possible.
- Source snapshots and import metadata must remain linked.
- Demo rows are excluded from real coverage/search by default.
- No fake fallback rows are allowed.
- No patient dosing instructions, how-to-take advice, treatment plan, stock, order, checkout, purchase, or live pharmacy wording is allowed.
- Verified rows must not be silently overwritten by later imports.
