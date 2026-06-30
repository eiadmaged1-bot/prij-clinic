# Official Medication Real Connectors v0.8.2

Sprint: GCC Real Medication Data QA + Connector Recovery.

Result on 2026-06-30:
- Bahrain NHRA real rows preserved: 3,169 variants, 1,850 product groups.
- Bahrain review workflow fixed: 3,169 open official review items for 3,169 `needs_review` rows.
- Oman MOH public Drug Safety Center price-list import added: 5,100 real official rows imported from the official PDF label `Pharmaceutical Products List With Prices 11 05 2026`.
- Oman file SHA-256: `ae9e43c25154587b8acbf62073c6b42760477dfc3b9455c95bb4a952a52e73e4`.
- Total real official rows: 8,269. Demo rows excluded from real counts: 23.

Statuses:
- BHR: imported, review-gated, review queue complete.
- OMN: imported, review-gated, review queue complete.
- QAT: failed; official HTML did not expose a supported XLSX link during dry-run.
- KWT: failed; official PDF candidate fetch failed.
- KSA: failed; official public HTML timed out or was not safely parseable.
- EG: official file upload and targeted lookup only.
- UAE: approved API or official upload required.
- YEM: disabled unless an official source is provided.

Medication data remains market/reference metadata only. Official/source price is not pharmacy stock, live shelf price, purchase, checkout, treatment advice, patient dosing, or automatic prescribing.
