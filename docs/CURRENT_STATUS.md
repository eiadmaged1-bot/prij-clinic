# Current Status

Medication verification Batch 3 for Bahrain and Oman is implemented.

Counts after v0.8.5 Batch 3:
- Bahrain NHRA: 3,169 real rows, 300 verified, 2,869 needs review.
- Oman MOH: 5,100 real rows, 300 verified, 4,800 needs review.
- Total real official rows: 8,269.
- Demo rows excluded: 23.
- Rejected/retired rows: 0/0.
- Total verified official rows: 600.
- Open review items: 7,669.

Review queue:
- Groups by country, source, import run, parser confidence, missing fields, duplicate risk, registration number, and candidate confidence.
- Admin/Owner can verify, reject, or retire selected rows with a reason.
- Batch verification is high-confidence-only and reason-required.
- Bahrain high-confidence candidates after batch 3 verification: 2,869.
- Oman high-confidence candidates after batch 3 verification: 4,729.
- Oman currently review-gated low-confidence/blocked candidates after batch 3 verification: 71.
- Local official medication export/verify/restore scripts are available; exports stay in ignored `storage/official-medication-exports/`.

Safety:
- Medication data remains market/reference metadata only.
- Doctor approval remains mandatory.
- No autonomous prescribing, patient dosing instructions, stock/order/checkout, retail scraping, or external AI calls.
