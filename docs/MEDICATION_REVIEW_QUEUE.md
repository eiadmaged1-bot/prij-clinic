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
