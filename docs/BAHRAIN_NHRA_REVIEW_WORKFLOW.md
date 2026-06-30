# Bahrain NHRA Review Workflow

The v0.8.1 Bahrain NHRA import preserved 3,169 official rows but did not create open review queue items. v0.8.2 rebuilds review items using `DrugMarketManualReviewQueue`.

Commands:

```powershell
npm run medication:bahrain:qa
npm run medication:bahrain:review:rebuild
npm run medication:bahrain:sample
npm run medication:review:summary -- --country BHR
```

Current QA:
- Real rows: 3,169.
- Product groups: 1,850.
- Needs review: 3,169.
- Open review items: 3,169.
- Verified/rejected/retired: 0/0/0.
- Source snapshots: 3.
- Import runs with file hashes: 3.

Admin/Owner may verify, reject, or retire selected rows only with a reason. The decision is audited. No row is bulk-verified automatically.
