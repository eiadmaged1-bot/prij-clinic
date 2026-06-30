# Medication Import Limitations

Current limitations:
- Qatar MOPH official XLSX candidate returned HTML rather than a file from the official server.
- Kuwait MOH PDF candidate failed to fetch.
- Saudi SFDA needs a stable official public export or endpoint before live import.
- Egypt requires owner-provided official files or one explicit targeted lookup at a time.
- PDF parsing is best effort and review-gated.

The system does not use retail metadata, unofficial mirrors, pharmacy stock/order/cart/checkout pages, protected-source bypasses, or external AI calls.

Official listed prices are source metadata only. They are not live shelf prices, dispensing instructions, or patient advice.
# v0.8.2 Import Limitations

- Bahrain and Oman rows are imported as official market/reference metadata only and remain review-gated.
- Qatar MOPH discovery still failed because official HTML did not expose a supported XLSX link.
- Kuwait MOH PDF fetch still failed from the official candidate.
- Saudi SFDA public HTML timed out or was not safely parseable.
- Egypt remains official file upload plus targeted lookup only; bulk enumeration is not allowed.
- No pharmacy stock, cart, checkout, purchase path, or retail metadata is used.
