# Patient Import

Owner/Admin flow: upload CSV/XLSX → choose encoding → map columns → dry-run preview → review READY/POSSIBLE_DUPLICATE/INVALID/NEEDS_REVIEW rows → select READY rows → commit → inspect batch report.

Files are size/type checked and hashed in memory; source files are not stored. XLSX formulas are disabled and formula-like cell values are rejected. No row auto-merges or overwrites a patient. Batch and row records retain hash, mapping, status, duplicate evidence, created patient link, and audit events.

Rollback currently requires a reviewed archive workflow using the preserved row-to-patient links; automatic deletion is intentionally unavailable.
