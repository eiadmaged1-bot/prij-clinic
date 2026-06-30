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
