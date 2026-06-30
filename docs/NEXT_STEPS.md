# Next Steps

The exact next branch after this v0.4 protocol + finance + gynecology + guideline integration is:

```text
leap/e-medication-herbal-safety-engine
```

## Medication And Herbal Safety Engine

Goals:

- Add medication and herbal safety foundations only after the current protocol integration is stable.
- Keep all medication behavior doctor-led and review-only.
- Do not implement autonomous prescribing.
- Do not implement autonomous diagnosis or treatment selection.
- Keep safety outputs as warnings, checks, or draft support that require doctor review.
- Use fake/demo data only in seeds, tests, and docs.
- Preserve RBAC, audit logs, route guards, protected `eyad` System Owner rules, guideline vault security, finance access separation, and protocol editor protections.

## Protocol Follow-Up Work

- Verify Emergency OB red flags protocol pack.
- Verify AUB protocol pack.
- Verify early pregnancy bleeding and ectopic protocol pack.
- Verify preeclampsia and hypertension protocol pack.
- Verify contraception protocol pack.
- Verify antenatal routine protocol pack.
- Verify postpartum protocol pack.
- Verify pelvic floor physiotherapy protocol pack.
- Add richer audit UI filtering for protocol and snapshot events.
- Keep protocol content short and structured unless a copyright/privacy review approves local guideline storage.

## Guideline Center Follow-Up

- Configure and operationally test a non-committed `GUIDELINE_VAULT_ENCRYPTION_KEY`.
- Keep `GUIDELINE_VAULT_ENCRYPTION_KEY` as a placeholder in committed examples only.
- Do not use real licensed files until a real non-committed vault key and encrypted backup/restore proof are configured.
- Add backup and restore proof for encrypted guideline files and database metadata together.
- Add upload malware scanning and file type inspection beyond browser MIME hints.
- Add key rotation and encrypted-storage incident procedures.
- Add official source adapters, scheduled update checks, richer search, and better PDF page mapping only after license, privacy, and access review.

## Production-Readiness Planning

Do not start real production deployment until the following are designed, implemented, tested, and reviewed:

- Patient-to-doctor assignment or another explicit clinical access model.
- Production consent enforcement, legal text, signature/capture policy, and override workflow.
- Secure PHI file storage with encryption, access control, malware scanning, audit logging, expiring links, backup policy, and retention rules.
- Production-grade audit retention, tamper resistance, export review, and alerting.
- Backup encryption, restore proof, operational runbooks, monitoring, incident response, and disaster recovery.
- MFA, password reset, session/device inventory, and production security operations.
- Payment compliance design before any real payment gateway.
- Legal/privacy review before real patient use.
- Any future AI provider integration must have consent, RBAC, audit, privacy, provider contract, and doctor-review controls before use.
# Medication Intelligence Next Steps

- Add official Egypt, UAE, and Yemen file ingestion once clinic-owned files are available.
- Expand verified interaction rules through licensed clinical data.
- Add scheduled official-source update checks.
- Improve prescription variant selection UX while keeping patient directions doctor-authored.
- Add broader visual Playwright coverage for medication admin pages.
# Next Steps: Clean Reference Theme Workflow

- Run DB-backed clean seed and reset dry-run when PostgreSQL is available.
- Expand reference importer scripts only after source licensing and access review.
- Add migration-backed audit events for future reference import execution.
- Keep AI draft features disabled until doctor-review workflow and audit requirements are complete.
