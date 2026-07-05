# PHI/PII and Document Safety

v0.16.0 prepares document and PHI/PII readiness gates. It does not authorize real patient data entry by itself.

Readiness controls:

- Patient document access stays patient-scoped and protected by authenticated permission guards.
- Image uploads are sanitized and metadata is stripped before storage.
- Upload storage uses an allowlist for supported file types.
- Local storage paths, hashes, and internal storage details should not appear in normal patient-facing UI.
- Print packets should avoid internal/developer identifiers where possible.
- Error UI should avoid stack traces, database internals, raw JSON, and secret names.
- Uploads, storage files, reports, PDFs, spreadsheets, raw imports, and generated artifacts must not be committed.

Limitations:

- v0.16.0 is a readiness check, not a complete production DMS.
- Production storage, encryption, retention, legal review, and access monitoring remain deployment work.
