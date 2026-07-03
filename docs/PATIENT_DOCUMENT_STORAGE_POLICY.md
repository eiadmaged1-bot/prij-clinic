# Patient Document Storage Policy

Patient document storage defaults to metadata-only.

## `metadata_only`

- No uploaded bytes are written.
- Image dimensions and sanitized hash metadata may be recorded.
- `exifStripped=true` is recorded for sanitized image uploads.
- No local path is stored.

## `local_demo_file`

- Allowed only for local/dev/test.
- Images are sanitized before write.
- The local path points to sanitized output only.
- Storage remains under ignored `storage/` paths.

## Production

Production must not use `local_demo_file`. If `production_external_storage_placeholder` is selected without a configured provider, the API fails closed.

PDFs and non-image documents still require production storage review before real clinical use.
