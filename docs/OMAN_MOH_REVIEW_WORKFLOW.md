# Oman MOH Review Workflow

Source:
- `OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES`
- Official Oman MOH Drug Safety Center price list.

Current counts after v0.8.4 Batch 2:
- Real rows: 5,100.
- Product groups: 4,611.
- Verified rows: 100.
- Needs-review rows: 5,000.
- Open official review items: 5,000.
- Demo rows excluded from real coverage/search by default.

Commands:

```powershell
npm run medication:oman:qa
npm run medication:oman:sample
npm run medication:oman:review:summary
npm run medication:oman:verify:batch -- --limit 100 --reason "Official Oman MOH high-confidence sample verification"
```

Batch 2 improved the Oman parser and verified 100 strict high-confidence rows with reason `Official Oman MOH high-confidence batch review`.
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
