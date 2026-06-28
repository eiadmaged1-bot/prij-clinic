# File Storage Security

Prij Clinic V0.1 does not implement real PHI file upload. Report records store metadata/reference text only.

Do not commit real reports, scans, images, DICOM files, PDFs, or patient documents.

## Current V0.1 Position

- No real files should be stored in the repository.
- `uploads/`, `storage/`, `private/`, and local report folders are ignored.
- Local development storage, if later enabled, must be treated as temporary and demo-only.
- Report attachments must be authorized by patient, branch, role, and explicit report permissions.
- AI/OCR must treat every file as untrusted input.
- The current `/reports` API stores metadata and optional reference text only; it does not accept multipart upload bodies.
- No public file URL, direct filesystem path, external object storage provider, OCR, or AI file processing is implemented.

## Safe Future Local Foundation

If file uploads are enabled in a later sprint, start with a local/dev-only foundation:

- Store files under ignored `uploads/`.
- Generate opaque storage keys; never return raw local paths.
- Require JWT and `report.upload` for upload.
- Require JWT and `report.read` or explicit export/download permission for access.
- Re-check patient, branch, report, and consent scope before every upload/view/download.
- Enforce a strict allowlist such as PDF only at first.
- Enforce conservative size limits.
- Write audit metadata for upload, view/download, replacement, void, and failed authorization.
- Keep uploaded demo files out of git, logs, audit payloads, AI prompts, and test fixtures.
- Disable OCR/AI processing for uploaded files.

## Production Requirements

Before accepting real report attachments, production storage must include:

- Private object storage or hardened private file storage.
- Encryption at rest.
- HTTPS in transit.
- Strict MIME/type allowlist.
- Virus/malware scanning.
- File size limits.
- Audit logging for upload, view, download, export, replacement, and void/delete actions.
- Expiring access links or application-streamed downloads.
- No permanent public URLs.
- Backup and restore policy for file storage separate from the database.
- Retention and deletion policy reviewed for the clinic context.
- Monitoring for unusual download/export volume.
- Operational runbooks for quarantine, removal, and incident review.

## Authorization

Report file access must never bypass the application. Every download or preview must check:

- Authenticated user.
- Required report permission.
- Patient/branch scope.
- Clinical/billing role boundaries.
- Consent status where applicable.
- Audit event creation.

## AI, OCR, And Future Integrations

- AI and OCR must not process files unless consent, privacy, provider, audit, RBAC, and doctor-review rules are approved.
- OCR output is untrusted draft text and must be reviewed by authorized staff.
- OCR fallback is acceptable only after file-security controls exist.
- DICOM/PACS/RIS integration is future work and requires a separate integration security design.

## Out Of Scope For V0.1

- Real PHI file uploads.
- Multipart upload endpoints.
- External object storage provider wiring.
- Public file URLs.
- Raw local path exposure.
- DICOM/PACS integration.
- OCR processing.
- AI interpretation of report files or fetal images.
