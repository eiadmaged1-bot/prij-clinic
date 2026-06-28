# File Storage Security

Prij Clinic V0.1 does not implement real PHI file upload. Report records store metadata/reference text only.

Do not commit real reports, scans, images, DICOM files, PDFs, or patient documents.

## Current V0.1 Position

- No real files should be stored in the repository.
- `uploads/`, `storage/`, `private/`, and local report folders are ignored.
- Local development storage, if later enabled, must be treated as temporary and demo-only.
- Report attachments must be authorized by patient, branch, role, and explicit report permissions.
- AI/OCR must treat every file as untrusted input.

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
- External object storage provider wiring.
- Public file URLs.
- DICOM/PACS integration.
- OCR processing.
- AI interpretation of report files or fetal images.
