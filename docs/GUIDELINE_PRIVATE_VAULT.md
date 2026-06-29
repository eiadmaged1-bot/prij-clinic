# Guideline Private Vault

Private licensed guideline files are stored locally under:

```text
storage/guidelines/private/
```

This folder is ignored by Git. Do not commit real PDFs, licensed files, extracted text, temp files, uploads, screenshots, or logs.

Default upload access is `OWNER_DOCTOR`. `OWNER_ONLY` is available for owner-restricted material.

Current limitation: local file encryption is not implemented in this sprint. Production use requires encrypted object storage, access logs, backup policy, retention rules, and restore tests.
