# Official Medication Real Connectors v0.8.1

Sprint: v0.8.1 Real Official Medication Source Connectors.

Implemented:
- Real official XLSX download/import path for Bahrain NHRA Registered Medicine Price List.
- Safe official-domain fetch policy with blocked login/CAPTCHA/paywall/retail URL patterns.
- XLSX parsing with flexible headers and raw official row preservation.
- Source snapshots, file SHA-256, import runs, source freshness, and coverage reporting.
- Egypt EDA official file upload path and targeted lookup guard. No bulk brute-force.

Real import result on 2026-06-30:
- Bahrain NHRA: 3,169 real rows imported from the official XLSX.
- File SHA-256: `021ea4dc427c81adebedb8152f67e67de7dc74417b65c2e276c58ca7d27112fc`.
- Imported rows are `needs_review`; none are silently verified.
- Demo rows remain excluded from real coverage/search by default.

Blocked/source-change results:
- Qatar MOPH candidate returned HTML instead of the XLSX from the official server.
- Kuwait MOH PDF candidate fetch failed.
- Saudi SFDA did not expose a stable direct public data endpoint in this conservative implementation.
- Egypt requires an official owner-provided file or one explicit targeted lookup query; no enumeration is implemented.

Medication data is market/reference metadata only. It is not patient dosing, how-to-take advice, treatment planning, autonomous prescribing, or pharmacy stock/order/checkout metadata.
