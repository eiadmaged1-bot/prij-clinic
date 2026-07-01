# Current Status

Medication restore drill and verification Batch 4 for Bahrain and Oman are implemented.

v0.9 visible experience work is in progress on the premium clinic OS browser experience:
- Premium shell/navigation now exposes Home, Patients, Calendar, Queue, Doctor Workspace, Orders, Finance, Reports, Medications, Guidelines/Protocols, and Owner controls in role-aware groups.
- Login, dashboard, patient creation, patient workspace, reception flow, doctor flow, owner control, finance, orders, consents, and medication reference pages have visible product polish.
- Medication work remains display-only for existing v0.8.6 data; no new official source importers were added.

Counts after v0.8.6 Batch 4:
- Bahrain NHRA: 3,169 real rows, 600 verified, 2,569 needs review.
- Oman MOH: 5,100 real rows, 600 verified, 4,500 needs review.
- Total real official rows: 8,269.
- Demo rows excluded: 23.
- Rejected/retired rows: 0/0.
- Total verified official rows: 1,200.
- Open review items: 7,069.

Review queue:
- Groups by country, source, import run, parser confidence, missing fields, duplicate risk, registration number, and candidate confidence.
- Admin/Owner can verify, reject, or retire selected rows with a reason.
- Batch verification is high-confidence-only and reason-required.
- Bahrain high-confidence candidates after batch 4 verification: 2,569.
- Oman high-confidence candidates after batch 4 verification: 4,429.
- Oman currently review-gated low-confidence/blocked candidates after batch 4 verification: 71.
- Local official medication export/verify/restore scripts are available; exports stay in ignored `storage/official-medication-exports/` and restore reports stay in ignored `storage/official-medication-restore-drills/`.
- Latest restore drill passed against `prij_clinic_medication_restore_test`.

Safety:
- Medication data remains market/reference metadata only.
- Doctor approval remains mandatory.
- No autonomous prescribing, patient dosing instructions, stock/order/checkout, retail scraping, or external AI calls.

Visible experience safety:
- The browser still states Local Demo / not production-ready.
- No real patient data, no real payment gateway, no external AI calls, and no diagnostic automation are introduced.
