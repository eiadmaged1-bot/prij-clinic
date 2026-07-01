# Medication Review Queue

Official imports create `DrugMarketManualReviewQueue` rows with `queueType = official_import_review`.

Review grouping now reports:
- country
- source
- import run
- parser confidence
- missing generic
- missing strength
- missing dosage form
- missing price
- duplicate risk
- registration number present/missing
- high-confidence candidates
- low-confidence candidates

Commands:

```powershell
npm run medication:review:summary
npm run medication:review:rebuild
npm run medication:review:sample
npm run medication:review:high-confidence
```

Admin/Owner review decisions:
- verify with reason
- reject with reason
- retire with reason
- bulk verify high-confidence official rows with country, source, limit, and reason

Receptionist and Accountant roles remain denied from import, review, verification, and clinical medication decision-support workflows.

Raw official JSON is not shown in normal UI. Protected admin review details may show that official row fields were captured.

## v0.8.4 Oman Batch 2

- Oman source: `OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES`.
- Oman real rows: 5,100.
- Oman verified rows: 100.
- Oman open review items: 5,000.
- Oman high-confidence candidates before batch verification: 5,029.
- Low-confidence, duplicate-risk, and incomplete rows remain blocked from batch verification.
- Review queue filters include Oman country/source, confidence, high-confidence candidates, and missing fields.

Review decisions require a reason and remain Admin/Owner-only through medication verification permissions.

## v0.8.5 Batch 3

- Bahrain verified rows: 300.
- Oman verified rows: 300.
- Total verified rows: 600.
- Open official review items: 7,669.
- Bahrain high-confidence candidates remaining: 2,869.
- Oman high-confidence candidates remaining: 4,729.
- Oman review-gated low-confidence/blocked rows: 71.

Batch verification remains reason-required, high-confidence-only, and Admin/Owner-only.
