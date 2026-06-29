# Guideline Secure Vault

Date: 2026-06-29

This sprint hardens private guideline file access before any real paid or licensed guideline PDFs are uploaded.

## Access Rules

- Private guideline files are never served from a public static folder.
- Files are streamed only through authenticated API endpoints:
  - `GET /guidelines/documents/:id/view`
  - `GET /guidelines/documents/:id/download`
- The frontend receives document metadata only. It must not receive `localFilePath` or storage paths.
- `OWNER_ONLY` documents can be viewed by Owner users only.
- `OWNER_DOCTOR` documents can be viewed by Owner and Doctor users.
- `CLINICAL_TEAM` remains available for future clinical-team policy, but Receptionist and Accountant users are still blocked from file access.
- Archived private documents are owner-only for file access.
- Missing files return a clean application error and are audited.

## Download Control

Downloads are disabled by default for private guideline uploads.

Only Owner users, or users with `guidelines.manage_private`, can update:

```text
PATCH /guidelines/documents/:id/file-access-settings
```

The current supported setting is:

```json
{ "downloadsAllowed": true }
```

Doctor users may view `OWNER_DOCTOR` files, but they cannot enable downloads. Receptionist and Accountant users cannot view or download guideline files.

## Audit Behavior

Every view and download attempt is audited:

- `guideline.file_view_allowed`
- `guideline.file_view_denied`
- `guideline.file_download_allowed`
- `guideline.file_download_denied`
- `guideline.file_access_settings_updated`
- `guideline.file_access_settings_denied`

Audit metadata records safe facts such as outcome, reason, access level, guideline status, license status, download setting, MIME type, and encrypted-at-rest flag. It must not record local file paths or file contents.

## Local Encryption

New uploads use local AES-256-GCM encryption when `GUIDELINE_VAULT_ENCRYPTION_KEY` is configured.

Accepted local key formats:

- Base64 value that decodes to 32 bytes.
- Hex value with 64 characters.
- A local development string that is exactly 32 bytes.

Optional:

```text
GUIDELINE_VAULT_ENCRYPTION_KEY_ID=local-dev-key
```

Do not commit real keys. Store local keys only in ignored environment files such as `.env`.

If no key is configured, local/demo uploads still work for test stability but are marked `fileEncrypted=false`. This fallback is for demo development only and is not acceptable for real licensed files.

## Production Requirements

Before real licensed guideline files are used:

- Configure a real encryption key outside the repository.
- Add operational key rotation and restore testing.
- Verify backups include encrypted files and database metadata together.
- Add malware scanning for uploads.
- Review license and retention policy.
- Keep no real PDFs, licensed files, storage folders, logs, backups, screenshots, or secrets in Git.
