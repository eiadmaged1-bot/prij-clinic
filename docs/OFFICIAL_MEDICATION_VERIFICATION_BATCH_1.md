# Official Medication Verification Batch 1

Date: 2026-06-30.

Scope:
- Bahrain NHRA Registered Medicine Price List.
- Oman MOH Registered Pharmaceutical Products With Prices.
- Market/reference metadata only; not dosing advice, prescribing guidance, stock, order, checkout, or patient self-medication support.

Result:
- Bahrain imported rows preserved: 3,169.
- Oman imported rows preserved: 5,100.
- Total real official rows preserved: 8,269.
- Demo rows excluded from real coverage/search by default: 23.
- Verified rows after batch: 100 Bahrain rows.
- Remaining needs-review rows: 8,169.
- Rejected rows: 0.
- Retired rows: 0.

Verification rule:
- Verification requires Admin/Owner permission in the API or an explicit local script run with a reason.
- Batch verification is limited by default to 100 rows.
- Only high-confidence official rows are eligible.
- Verified rows are protected from silent overwrite; later import conflicts create review items.

Oman note:
- Oman rows remain review-gated because current PDF parser confidence is 0.59 and all Oman rows are classified as low-confidence.
- `npm run medication:oman:verify:batch` intentionally verified 0 rows.
