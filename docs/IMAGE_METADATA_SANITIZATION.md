# Image Metadata Sanitization

V0.10.6 strips image metadata at the `apps/api` boundary for patient document uploads.

## Rules

- Raw uploaded image bytes are never persisted.
- JPEG, PNG, and WebP uploads are decoded in memory and re-encoded with `sharp`.
- The sanitizer does not call `withMetadata()`, so EXIF, GPS, XMP, IPTC, device, software, and original timestamp metadata are stripped.
- Orientation is normalized visually with `rotate()` before output.
- HEIC/HEIF are rejected until the runtime and legal/security review explicitly support them.
- Unsupported image types fail closed.
- The original image hash is computed in memory only for internal audit/deduplication and is not exposed as a public identity.

## Storage Modes

- `metadata_only`: stores only safe document metadata and sanitized image dimensions/hash metadata. No file bytes are written.
- `local_demo_file`: local/dev/test only. Writes sanitized output under ignored local storage.
- `production_external_storage_placeholder`: fails closed unless a production provider is configured.

## Tests

- `npm run test:security:image-metadata`
- `npm run test:security:document-upload` when the local API and database are running

Do not upload real patient images before production storage, malware scanning, retention, consent, privacy, and legal readiness are complete.
