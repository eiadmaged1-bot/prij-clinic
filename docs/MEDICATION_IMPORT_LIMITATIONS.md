# Medication Import Limitations

Current limitations after Batch 1:
- Oman rows are preserved and review-gated, but the current PDF parser confidence remains low at 0.59. Batch verification is blocked until parser confidence is defensibly improved or rows are manually reviewed.
- Qatar MOPH discovery still did not expose a supported public XLSX link.
- Kuwait MOH official PDF candidate fetch still failed.
- Saudi SFDA public HTML timed out or was not safely parseable.
- Egypt remains official file upload plus targeted lookup only. No enumeration, CAPTCHA/session bypass, or protected-source bypass is allowed.
- UAE requires approved API access or official upload.

Blocked source classes:
- retail metadata
- pharmacy stock/order/cart/checkout/purchase pages
- third-party mirrors
- login/CAPTCHA/paywall/API-approval bypasses
- external AI calls

Official/source price is source metadata only, not a live shelf price or dispensing instruction.
