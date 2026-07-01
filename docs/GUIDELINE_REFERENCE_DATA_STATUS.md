# Guideline Reference Data Status

The local demo supports source registry and protocol atlas browsing. It does not claim complete guideline ingestion.

Verify:

```powershell
npm run guidelines:v097:ready-check
```

Expected honest state:
- WHO, NICE, RCOG, ACOG, FIGO, ESHRE, ASRM, SMFM, and CDC source metadata should exist.
- Protocol atlas metadata should include key women's health terms.
- Full guideline document/chunk content exists only where previously seeded/imported.
- Full guideline document ingestion still requires owner-provided/open PDFs and governance review.
- External AI remains disabled/mock-only.
