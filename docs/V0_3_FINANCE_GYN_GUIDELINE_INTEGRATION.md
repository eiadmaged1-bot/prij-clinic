# v0.3 Finance + Gynecology + Secure Guideline Center Integration

Date: 2026-06-29

Branch: `integration/v0.3-finance-gyn-guidelines`

Base branch: `integration/v0.3-finance-gyn`

Merged sources:

- `integration/v0.3-finance-gyn` at `f4ce33a1c8a4dfd4807170979dd18f9510ba34bd`, tag `v0.3-finance-gyn-integrated`
- `origin/hardening/guideline-secure-vault` at `7a0a46d606c978995062a92374d91b00b8bc0267`, tag `v0.3.1-guideline-secure-vault`

Target tag: `v0.3.2-finance-gyn-guidelines-integrated`

## Integrated Scope

This line combines the v0.3 finance/report and general gynecology workflow with the secure local Guideline Center.

Included:

- Finance/report deepening, service catalog, manual billing, payments, refunds, daily closing, patient statement, and owner finance reports.
- Pregnancy/OB workflow, OB ultrasound recording, antenatal records, and patient timeline events.
- General Gynecology workspace and recording-only templates for abnormal bleeding, pelvic pain, PCOS, fibroid or ovarian cyst, and contraception counseling.
- Patient file tabs: Summary, Pregnancy/OB, General Gynecology, Encounters, Prescriptions, Investigations, Billing/Finance, Files, Timeline, More.
- Secure Guideline Center pages for Evidence Library, search, ask, source registry, upload, imports, review, updates, and private vault.
- Guideline source registry metadata, upload/import/reindex/update-check scripts, secure viewer/download workflow, file access audit, and private vault controls.

Still separate or not included:

- No real patient data.
- No real guideline PDFs or licensed files.
- No real AI calls.
- No real payment gateway.
- No WhatsApp.
- No insurance/TPA.
- No inventory.
- No DICOM/PACS.
- No automatic diagnosis.
- No automatic treatment recommendation.
- No automatic prescribing.
- No fake percentile or FGR engine.

## Guideline Vault Encryption

New private guideline uploads are encrypted with AES-256-GCM only when `GUIDELINE_VAULT_ENCRYPTION_KEY` is configured outside the repository.

Repository env examples contain placeholders only:

```text
GUIDELINE_VAULT_ENCRYPTION_KEY=
GUIDELINE_VAULT_ENCRYPTION_KEY_ID=local-dev-key
```

Do not commit a real vault key. Do not upload real licensed guideline files until a real non-committed vault key, encrypted backup/restore proof, malware scanning, retention policy, and license operations are approved.

## Role Access

- Owner/System Owner can manage guideline sources, imports, review, private vault settings, and finance/admin workflows.
- Doctor can use clinical workflows, General Gynecology, Pregnancy/OB, and authorized guideline read/search/upload workflows.
- Admin has limited guideline read/search from seeded demo permissions.
- Receptionist and Accountant are blocked from guideline medical content, guideline search/ask, private document access, secure viewer, and downloads.
- Nurse guideline access is hidden by default because seeded nurse permissions do not include guideline permissions.
- Finance navigation is permission-aware and remains available only to authorized finance roles.
- General Gynecology tab visibility remains tied to clinical encounter permissions.

Server-side RBAC remains the authorization boundary. UI hiding is only a usability layer.

## Tests Run

All tests used fake/demo data only.

- `git diff --check`: passed.
- `npm run prisma:repair`: passed.
- `npm run prisma:migrate:deploy`: passed; 17 migrations found, none pending on the local database.
- `npm run prisma:seed`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run test:security:ci`: passed with existing warnings about seeded demo patient window and `/ai-drafts` endpoint naming.
- `npm run test:security:expanded`: passed with existing broad-route and fixture-visibility warnings.
- `npm run test:theme:ui`: passed.
- `npm run test:doctor:ux`: passed.
- `npm run test:visual:qa`: passed.
- `npm run test:e2e:v01`: passed with existing fake/demo readiness warning.
- `npm run test:clinical:persistence`: passed.
- `npm run test:obgyn:core`: passed.
- `npm run test:accounts:rbac`: passed.
- `npm run test:finance:reports`: passed.
- `npm run test:gyn:starter`: passed.
- `npm run test:guidelines`: passed.
- `npm run test:integrated:probes`: passed.
- `npm run test:staging:smoke`: first refused under `APP_ENV=local`, then passed when rerun with explicit staging-mode variables against the local fake/demo app.

## Safety Boundaries

- This is not production-ready and not a medical device.
- Clinical records remain doctor-led and audit-aware.
- Guideline answers are local evidence summaries only and require doctor review.
- Guideline Center does not modify patient records.
- AI draft placeholders remain disabled/mock-only.
- Finance remains manual and gateway-free.
- Browser print output is not legal clinical stationery, receipt output, or audited production export.

## Remaining Limitations

- Production consent enforcement, legal text, signature capture, and override policy remain incomplete.
- Patient-to-doctor assignment remains unmodeled.
- Audit logs are application append-only but not database-tamper-resistant.
- Production MFA, session inventory, secret rotation, monitoring, incident response, and legal/privacy review remain future work.
- Guideline vault key rotation, malware scanning, encrypted backup/restore proof, retention policy, and production object storage are not implemented.
- PDF extraction is basic and local search is keyword-based, not semantic search.

## Exact Next Sprint Recommendation

Pilot Demo Data + Browser Walkthrough Hardening:

- Prepare a clean fake/demo walkthrough dataset.
- Add script-assisted browser walkthroughs for Owner, Doctor, Receptionist, Accountant, Pregnancy/OB, General Gynecology, Billing/Finance, Guideline Center, patient timeline, print views, and role denials.
- Tighten wording, empty states, print formatting, and small workflow friction found during rehearsal.
- Keep all data fake/demo-only.
- Keep clinical behavior recording-only and doctor-led.
- Keep finance manual and gateway-free.
- Keep Guideline Center local, citation-based, and doctor-reviewed.
