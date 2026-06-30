# Drug Market Source Policy

Blocked:
- Login-required sources.
- CAPTCHA or protected sources.
- Paywall sources.
- Retail checkout/cart/order/stock URLs.
- Branch stock or purchase paths.
- Unapproved source policies.
- Disabled retail metadata connectors.

Allowed:
- Official public regulatory sources where allowed.
- Official CSV, Excel, JSON, or PDF exports when safely supported.
- Owner-provided official files.
- Licensed provider files.

Priority:
- Official registry/source rows take priority over retail metadata.
- Imported rows default to review-gated states until verification.
- Retail metadata is disabled by default and must not silently overwrite verified official data.
- Price text and currency are metadata only, tied to source/import context where available. The app must not claim live shelf price, stock, checkout, or purchase availability unless a future approved source explicitly supports that claim.
