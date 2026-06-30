# Next Steps

## V0.7 Follow-Up

1. Import and verify official Egypt/GCC medication-market sources before treating country coverage as usable reference data.
2. Keep retail metadata connectors disabled by default until legal, privacy, and source-license review is complete.
3. Expand Medication Intelligence Engine v2 tests around source import, manual review, duplicate merge candidates, and role denials.
4. Review every medication interaction rule, herbal warning, and market mapping through qualified clinical governance before real use.
5. Keep medication and prescription safety output draft-only; doctor approval remains mandatory.

## V0.7 Workflow Follow-Up

1. Expand visual QA for patient Results, Documents, Consents, Referrals, Tasks, Internal Notes, Timeline, and Print Packet tabs.
2. Add deeper lower-role positive-path tests for nurse/reception/accountant task and document metadata workflows.
3. Design production file storage separately before accepting PHI uploads.
4. Add secure export policy before PDF generation.
5. Keep result interpretation doctor-authored only and AI disabled.

1. Run and archive the full v0.6 audit verification suite from `docs/V0_6_MASTER_UNIFIED_AUDIT.md`.
2. Keep v0.6 stabilization limited to defects, tests, docs, and safety hardening; do not add major features until the unified branch is stable.
3. Add focused visual/manual QA for the patient workspace medication, allergy, herbal/supplement, medication safety, AI snapshot, OB dating, guideline, and protocol tabs.
4. Add more lower-role denial coverage for receptionist/accountant access to clinical AI, medication safety, drug-market admin, guideline medical library, and protocol verification.
5. Review every verified calculator formula, medication interaction rule, herbal warning, and verified protocol pack with qualified clinical governance before real-world use.
6. Keep marketed medication strength/form/package fields as market metadata only; patient directions must remain doctor-authored prescription fields.

## V0.5 Carry-Forward Items

1. Review every verified calculator formula with a qualified clinician before real-world use.
2. Add richer patient-file placement for compact OB Dating Card in every future patient header component.
3. Add formal formula approval workflow with reviewer identity and source attachment policy.
4. Expand Playwright/manual QA for calculator hub and admin registry visual states.
5. Add verified ultrasound formulas only after source review and governance approval.
6. Keep AI disabled and draft-only; calculators must remain deterministic local code.
7. Add richer audit UI filtering for protocol, guideline, calculator, and snapshot events.
8. Add local guideline document storage and citation metadata only after privacy and copyright review.
9. Consider future local RAG only after privacy, consent, and clinical governance review.
10. Verify additional protocol packs after clinical governance review:
   - Hypertension/preeclampsia full pathway.
   - Early pregnancy non-emergency full pathway.
   - Postpartum/lactation.
   - Pelvic floor physiotherapy.
   - Menopause.
   - Breast health.

# Recommended Next Sprint

1. Investigations, radiology, and lab results deepening.
2. Consent, legal forms, and patient document archive.

Suggested sprint name: Investigations/Radiology/Lab Results Deepening + Consent/Legal Forms + Patient Document Archive.
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

- Add official Egypt, UAE, Yemen, and broader GCC file ingestion once clinic-owned files are available.
- Expand verified interaction rules through licensed clinical data.
- Add scheduled official-source update checks.
- Improve prescription variant selection UX while keeping patient directions doctor-authored.
- Add broader visual Playwright coverage for medication admin pages.
