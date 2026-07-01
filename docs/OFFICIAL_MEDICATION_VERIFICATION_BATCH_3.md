# Official Medication Verification Batch 3

Date: 2026-07-01.

Scope: Bahrain NHRA and Oman MOH official market/reference metadata only. Strength, form, pack, and official/source price remain metadata, not dosing instructions or prescribing guidance.

Commands run:

```powershell
npm run medication:bahrain:verify:batch -- --limit 200 --reason "Official NHRA high-confidence verification batch 3"
npm run medication:oman:verify:batch -- --limit 200 --reason "Official Oman MOH high-confidence verification batch 3"
```

Result:
- Total real official rows: 8,269 before and after.
- Bahrain verified rows: 100 before, 300 after.
- Oman verified rows: 100 before, 300 after.
- Total verified rows: 200 before, 600 after.
- Open review items: 8,069 before, 7,669 after.
- Demo rows excluded: 23.
- Rejected/retired rows: 0/0.

Remaining:
- Bahrain high-confidence candidates: 2,869.
- Oman high-confidence candidates: 4,729.
- Oman currently review-gated low-confidence/blocked rows: 71.
- Duplicate-risk rows remain blocked from batch verification.

No fake fallback rows, external AI calls, patient dosing instructions, stock/order/cart/checkout workflow, or raw official files were added.

