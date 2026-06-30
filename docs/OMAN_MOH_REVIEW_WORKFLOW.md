# Oman MOH Review Workflow

Source:
- `OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES`
- Official Oman MOH Drug Safety Center price list.

Current counts after Batch 1:
- Real rows: 5,100.
- Product groups: 4,020.
- Verified rows: 0.
- Needs-review rows: 5,100.
- Open official review items: 5,100.
- Demo rows excluded from real coverage/search by default.

Commands:

```powershell
npm run medication:oman:qa
npm run medication:oman:sample
npm run medication:oman:review:summary
npm run medication:oman:verify:batch -- --limit 100 --reason "Official Oman MOH high-confidence sample verification"
```

Batch 1 did not verify Oman rows because the current PDF parser confidence is 0.59, below the high-confidence verification threshold. This is intentional. The next Oman step is parser improvement or manual row-level review, not auto-verification.

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
