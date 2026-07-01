# Medication Import Limitations

Current limitations after Batch 2:
- Oman parser confidence improved and 100 strict high-confidence rows were verified. The remaining 5,000 Oman rows stay review-gated; 71 low-confidence or blocked candidates are not eligible for batch verification.
- Qatar MOPH discovery still did not expose a supported public XLSX/source-file link.
- Kuwait MOH official PDF candidate fetch still failed.
- Saudi SFDA public HTML did not expose a parseable server-rendered table in dry diagnostics.
- Egypt remains official file upload plus targeted lookup only. No enumeration, CAPTCHA/session bypass, or protected-source bypass is allowed.
- UAE requires approved API access or official upload.

Blocked source classes:
- retail metadata
- pharmacy stock/order/cart/checkout/purchase pages
- third-party mirrors
- login/CAPTCHA/paywall/API-approval bypasses
- external AI calls

Official/source price is source metadata only, not a live shelf price or dispensing instruction.
## v0.8.5 Source Recovery

- Qatar MOPH: diagnostic-only until a supported official public file link or owner-provided official file is available.
- Kuwait MOH: diagnostic-only until the official PDF is fetchable or an owner-provided official PDF/file is supplied.
- Saudi SFDA: diagnostic-only for the current public HTML path because no parseable server-rendered table is exposed.
- Egypt EDA: official file upload plus explicit targeted lookup only.
- UAE MOHAP: approved API access or official owner-provided file only.

No third-party mirrors, CAPTCHA/login/paywall/API-approval bypass, retail stock/order/checkout sources, or fake fallback rows are allowed.
