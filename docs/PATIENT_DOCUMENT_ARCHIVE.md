# Patient Document Archive

V0.7 adds a patient document archive model and patient-scoped endpoints.

## Current Mode

The archive is metadata-only by default.

- `storageMode=metadata_only`
- No real PHI documents.
- No raw file contents in the database.
- No production object storage.
- No OCR.
- Files and document metadata are treated as untrusted.
- Images uploaded through the API are sanitized in memory before storage identity hashes, document records, previews, or local demo writes.
- EXIF, GPS, device, software, and original capture timestamp metadata are stripped from JPEG, PNG, and WebP image uploads.
- `local_demo_file` is allowed only in local/dev/test environments and stores sanitized output only.
- Production must use a configured external storage provider later; local file storage fails closed in production.

Archive and void actions require a reason and are audited. There are no hard-delete patient document endpoints.

## Future Work

Production file storage requires encrypted private storage, malware scanning, file type inspection, expiring access, backup/restore proof, retention policy, and legal/privacy review.
