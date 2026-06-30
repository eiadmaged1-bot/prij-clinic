# Bahrain NHRA Review Workflow

Source:
- `BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST`
- Official NHRA registered medicine price list.

Current counts after Batch 1:
- Real rows: 3,169.
- Product groups: 1,850.
- Verified rows: 100.
- Remaining needs-review rows: 3,069.
- Open official review items: 3,069.
- Demo rows excluded from real coverage/search by default.

Commands:

```powershell
npm run medication:bahrain:qa
npm run medication:bahrain:sample
npm run medication:bahrain:review:summary
npm run medication:bahrain:verify:batch -- --limit 100 --reason "Official NHRA high-confidence sample verification"
```

QA checks:
- trade name or generic name present
- country code is `BHR`
- source/import metadata present
- source file hash present
- official row JSON present
- parser confidence present
- price currency is `BHD` where price exists and no source currency is supplied
- registration/DRN is preserved when present
- no patient dosing instructions
- no stock/order/cart/checkout/purchase workflow fields

Verification remains reference metadata only. Strength, form, pack, and official/source price are not patient instructions.
