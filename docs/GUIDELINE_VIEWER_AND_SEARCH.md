# Guideline viewer and search

v1.4.6 forwards `Range` through the proxy and returns private PDF 206/416 responses with page metadata. The KFS July 2026 PDF remains unimported. Use authenticated upload → extraction → cited draft → authorized review; never commit the PDF.

The retained original PDF is authoritative. Desktop uses contents/thumbnails, document, and citation panels; mobile uses PDF/Summary/Sections/Sources tabs. Page links, zoom, fit, rotate, fullscreen, remembered page, search, swipe, permission-aware download, and fallback are supported. Structured summaries are drafts until authorized doctor review; every material bullet needs an exact page citation. Cross-document synthesis is explicitly doctor-review required.

## v1.4.7 integrity behavior

Navigation is `Library | Search | Review Queue | Upload`. Active documents, recently indexed documents, and the authorized all-record inventory are distinct; the backend inventory no longer has a 100-document cap. Upload requires explicit intent. Exact duplicate hashes are rejected and audited with before/after counts, IDs, hash, decision, and status changes.

The distinct antibiotics record is labeled `Antibiotics for Obstetrics and Gynecology`, `KFS General Hospital Clinical Pharmacy Unit`, `July 2026`. Approval/review state was not promoted. Its source PDF remains unavailable.

The PDF UI shows loading, error/retry, compact controls, and an unknown total until metadata exists instead of claiming 1 of 1. PDF and Sources use the same asset. True PDF.js-derived metadata and version-specific asset storage remain incomplete; create-version and restore-asset uploads are blocked.
