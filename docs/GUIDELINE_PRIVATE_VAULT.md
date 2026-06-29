# Guideline Private Vault

Private licensed guideline files are stored locally under:

```text
storage/guidelines/private/
```

This folder is ignored by Git. Do not commit real PDFs, licensed files, extracted text, temp files, uploads, screenshots, or logs.

Default upload access is `OWNER_DOCTOR`. `OWNER_ONLY` is available for owner-restricted material.

## Secure Access

Private files are accessed only through the API:

- `GET /guidelines/documents/:id/view`
- `GET /guidelines/documents/:id/download`
- `PATCH /guidelines/documents/:id/file-access-settings`

No raw local file path is returned to the frontend. No private guideline file is intentionally exposed through static public serving.

Receptionist and Accountant users cannot view or download guideline files. Doctor users can view `OWNER_DOCTOR` documents. Owner users can view owner-only documents and can enable or disable downloads.

Downloads are disabled by default for private licensed uploads and can be enabled only by the owner.

## Audit

Every file view and download attempt is audited, including denied attempts, missing files, and disabled downloads. The private-vault UI shows an access-audited notice and the last successful viewed/downloaded indicator when available.

## Encryption Status

Local AES-256-GCM encryption is implemented for new uploads when `GUIDELINE_VAULT_ENCRYPTION_KEY` is configured in an ignored environment file.

If no key is configured, local/demo uploads fall back to unencrypted local storage for test stability and are marked as local demo storage. This fallback must not be used with real licensed files.

See `docs/GUIDELINE_SECURE_VAULT.md` for key format and operational requirements.
