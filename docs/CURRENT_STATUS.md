# Current Status

Medication verification Batch 1 is implemented.

Counts after Batch 1:
- Bahrain NHRA: 3,169 real rows, 100 verified, 3,069 needs review.
- Oman MOH: 5,100 real rows, 0 verified, 5,100 needs review.
- Total real official rows: 8,269.
- Demo rows excluded: 23.
- Rejected/retired rows: 0/0.

Review queue:
- Groups by country, source, import run, parser confidence, missing fields, duplicate risk, registration number, and candidate confidence.
- Admin/Owner can verify, reject, or retire selected rows with a reason.
- Batch verification is high-confidence-only and reason-required.

Safety:
- Medication data remains market/reference metadata only.
- Doctor approval remains mandatory.
- No autonomous prescribing, patient dosing instructions, stock/order/checkout, retail scraping, or external AI calls.
