# Oman MOH Review Workflow

Source:
- `OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES`
- Official Oman MOH Drug Safety Center price list.

Current counts after v0.8.5 Batch 3:
- Real rows: 5,100.
- Product groups: 4,611.
- Verified rows: 300.
- Needs-review rows: 4,800.
- Open official review items: 4,800.
- High-confidence candidates remaining: 4,729.
- Review-gated low-confidence/blocked rows: 71.
- Demo rows excluded from real coverage/search by default.

Commands:

```powershell
npm run medication:oman:qa
npm run medication:oman:sample
npm run medication:oman:review:summary
npm run medication:oman:verify:batch -- --limit 100 --reason "Official Oman MOH high-confidence sample verification"
```

Batch 2 improved the Oman parser and verified 100 strict high-confidence rows. Batch 3 verified another 200 strict high-confidence rows with reason `Official Oman MOH high-confidence verification batch 3`.
Rows remain review-gated unless verified explicitly.

QA checks:
- trade name or generic name present
- country code is `OMN`
- source/import metadata present
- source file hash present
- official row JSON present
- parser confidence present
- price currency is `OMR` where price exists and no source currency is supplied
- registration number preserved when present
- no patient dosing instructions
- no stock/order/cart/checkout/purchase workflow fields

Batch 2 parser audit:
- `>= 0.90`: 3,507 rows
- `>= 0.80`: 3,833 rows
- `>= 0.70`: 4,883 rows
- `>= 0.60`: 5,041 rows
- `< 0.60`: 59 rows

Remaining low-confidence and duplicate-risk rows are blocked from batch verification.
