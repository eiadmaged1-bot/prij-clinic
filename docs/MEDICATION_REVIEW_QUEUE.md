# Medication Review Queue

Official imports create `DrugMarketManualReviewQueue` rows with `queueType = official_import_review`.

Review reasons may include:
- missing generic/scientific name
- missing strength
- missing dosage form
- missing source metadata
- missing price currency
- low parser confidence
- duplicate risk

Admin/Owner review decisions:
- verify with reason
- reject with reason
- retire with reason

Each decision updates related open review items and writes a high-severity audit log entry. Receptionist and Accountant roles remain denied from import/review/admin workflows.
