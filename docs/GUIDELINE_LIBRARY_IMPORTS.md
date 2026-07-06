# Guideline Library Imports

Guideline Library is search-first. v1.3.3 fixes actual official/open guideline import and indexing so the library no longer depends on a one-off URL command.

Doctors see Guidelines, Search, Browse, Ask Evidence Library, and Recent. Owner/Admin sees Import official guidelines, Upload Licensed PDF, Sources Registry, Needs Review, and Private Vault when permitted.

## Official Import

`npm run guidelines:import:official` now uses a built-in official/open source pack covering WHO, NICE, CDC, ESHRE, and RCOG link-only registry entries.

The importer follows redirects, verifies PDF responses, stores downloaded PDFs in gitignored private storage, extracts text, indexes chunks, and prints a clear summary:

- imported PDFs
- indexed documents
- indexed chunks
- link-only
- failed
- skipped existing

The importer is idempotent. Re-running it skips existing imported sources instead of duplicating documents.

## Storage And Access

Guideline PDFs are stored only in gitignored private storage. Do not commit PDFs to GitHub.

No paywall bypass, login-only scraping, or restricted-source scraping is allowed. Restricted, unclear, or non-downloadable sources are stored as link-only or require manual licensed upload.

External AI remains disabled by default. Evidence Library answers are assistive drafts only and must not diagnose, prescribe, dose, rank treatment, or finalize clinical decisions.
