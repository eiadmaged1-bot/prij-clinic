# Current Status

# V0.6 Master Unified Integration

Branch `integration/v0.6-master-unified` is the current unified source-of-truth branch after merging:

- Latest calculator + AI management mega integration.
- Medication Intelligence Engine, herbal/supplement references, medication safety, patient medication/allergy lists, and drug-market metadata workflows.

The unified branch keeps the calculator/AI/guideline/protocol model area and the medication/drug-market model area together. Patient workspace tabs remain role-aware and focused: medication, allergy, herbal/supplement, medication safety, and prescription safety tabs appear only for users with the relevant permissions.

Clinical safety state remains unchanged:

- AI cannot diagnose, prescribe, sign, approve, bypass RBAC, or update final signed clinical records.
- Medication safety cannot auto-prescribe, sign, approve, or edit prescriptions.
- Marketed medication strength/form/package data is country/source market metadata only, never patient dosing instructions.
- Receptionist and accountant roles remain blocked from clinical AI, medication safety, drug-market admin, guideline medical library workflows, and protocol verification.

See `docs/V0_6_MASTER_UNIFIED_AUDIT.md` for the source-of-truth audit.

# V0.5.2 Calculators + AI Mega Integration

Integration branch `integration/v0.5-calculators-ai-mega` merges:

- AI Management Mega base at `a803bee`.
- Medical Calculator Suite source at `c752a62`.

The integration preserves calculator, OB dating, verified protocol pack, AI snapshot, guideline center, pilot walkthrough, RBAC denial, and audit-log functionality from both branches.

Medical Calculator Suite and Always-On OB Dating Engine sprint added:

- `CalculatorFormula`
- `PatientCalculation`
- `PregnancyDatingAssessment`
- `Patient.patientType`
- calculator API and admin registry API
- verified safe handler formula engine
- OB dating candidate, Best EDD, lock, locked-change, and void workflows
- patient-linked calculation history
- `/calculators` hub
- `/admin/calculators` metadata registry
- always-on OB Dating Card for OB patients and active pregnancies
- GYN/Women Health hide behavior when no active pregnancy exists
- focused calculator and OB dating tests

# V0.5 AI Management Mega Leap Status

Implemented:
- Four verified protocol packs for emergency OB/early pregnancy, AUB/menstrual disorders, contraception, and routine antenatal care.
- Pack-specific AI Management Snapshot headings and output limits.
- Local Guideline Center foundation with source registry, demo text import, local chunk search, extractive/mock ask, query logs, RBAC, and audit.
- Guideline route coverage in the shared route authorization manifest.
- Script-assisted pilot walkthrough automation for owner, doctor, receptionist, accountant, clinical, finance, AI management, guideline, role-denial, and full demo flows.
Branch: `integration/v0.4-protocol-finance-gyn-guidelines`

Integrated base: `integration/v0.3-finance-gyn-guidelines` at `8a37881`.

This branch integrates finance/report deepening, general gynecology, the secure Guideline Center and private guideline vault, the Women's Health Protocol Atlas, and protocol editor hardening on top of the locked MVP pilot OB/GYN workflow.

The intended pilot flow is now:

```text
Owner login -> patient file -> Pregnancy/OB or General Gynecology -> Protocol Atlas when authorized -> Encounters -> Prescriptions -> Investigations -> Billing/Finance -> Guideline Center when authorized -> Timeline -> Print summaries -> role-safe account behavior
```

- raw JSON editing is blocked in the UI
- every source/content/status change requires an audit reason
- catalog-only, draft, retired, and unknown protocols generate no management advice
- snapshot output remains deterministic and local with no external AI calls

Not fully implemented:
- Full Playwright/real-browser click automation with screenshots.
- Real PDF extraction.
- Production clinical governance approval of guideline source versions.

Remaining production work includes formal clinical formula review, richer UI polish, validated ultrasound coefficient governance, and production compliance review.

Latest local verification passed:

- Prisma repair/generate, migration deploy, seed.
- Typecheck and production build.
- Security, UI, workflow, clinical persistence, OB/GYN, account RBAC, finance, gynecology, AI regression, protocol atlas, AI management, calculator, OB dating, protocol pack, and guideline tests.
- Pilot walkthroughs for owner, doctor, receptionist, accountant, clinical, finance, AI, guidelines, denials, and demo.
- Local route spot checks for calculator/guideline/AI role denials and blocked draft/unknown clinical outputs.

`test:staging:smoke` was not run because local `APP_ENV=local`; staging smoke remains environment-gated.
This remains local/demo software only. It is not production-ready, not a medical device, and must not be used with real patient data, real payment data, PHI uploads, external AI providers, or live clinical workflows.

## Integrated Scope

- Patient file tabs include Summary, Pregnancy/OB, General Gynecology, AI Snapshot, Encounters, Prescriptions, Investigations, Billing/Finance, Files, Timeline, and More.
- Finance and gynecology coexist in the patient file; neither tab hides the other for authorized users.
- Guideline Center and private vault access rules remain hardened for Owner/Admin/Doctor evidence-library workflows.
- Women's Health Protocol Atlas adds `ClinicalProtocol` seed data, `/protocol-atlas`, and `/admin/protocol-atlas`.
- AI Management Snapshots add `AIManagementSnapshot` and `PatientClinicalMemory` for local deterministic, draft-only management snapshots and doctor-approved memory saves.
- Protocol editor hardening blocks raw JSON editing in normal UI, requires audit reasons for source/content/status changes, and keeps unverified, draft, retired, and catalog-only protocols from producing management advice.

## Safety State

- Seed data and automated tests use fake/demo-only records.
- No real AI API calls or provider SDK usage are implemented.
- AI output remains assistive, deterministic/local, draft-only, and doctor-review-only.
- AI cannot diagnose, prescribe, sign, approve, or update final clinical records.
- Protocol atlas content is not a clinical certification engine.
- Clinician interpretation is required for ultrasound, Doppler notes, fetal biometry, pregnancy risk notes, gynecology impressions, report impressions, guideline summaries, protocol content, and AI management snapshots.
- Payment records are demo metadata only and do not use a real payment gateway.
- Guideline private vault encryption is optional for local/demo uploads and requires a non-committed `GUIDELINE_VAULT_ENCRYPTION_KEY`; placeholders only are documented in env examples.
- The protected `eyad` account is the only seeded local demo System Owner.

## Finance Status

- Service catalog placeholders, demo invoice lines, manual payments, partial/paid/unpaid states, refund/reversal/void patterns, daily closing, patient statements, and owner finance reports are integrated.
- Finance remains manual and demo-only. No real payment gateway, accounting ledger, insurance/TPA, tax engine, or e-invoicing is implemented.

## General Gynecology Status

- General Gynecology workspace is integrated into the patient file for authorized clinical users.
- Gynecology visit persistence is implemented through `GynecologyVisit`.
- Starter templates cover general visit, abnormal uterine bleeding, pelvic pain, PCOS, fibroid or ovarian cyst, and contraception counseling.
- Templates are recording-only. They do not diagnose, recommend treatment, recommend contraception methods, or prescribe.

## Guideline Vault Status

- Secure Guideline Center supports source registry metadata, upload/import/search/ask/review/archive, private file view/download controls, file access audit, and optional AES-256-GCM local vault encryption.
- Receptionist and Accountant remain blocked from guideline medical content and private vault files.
- No external AI provider is called by guideline workflows.

## Protocol Atlas Status

- Women's Health Protocol Atlas seed data is present.
- Clinical authorized users can access `/protocol-atlas`.
- Owner/Admin users can access `/admin/protocol-atlas` for protected editor workflows.
- Verified snapshot generation is limited to the protocol set explicitly marked verified by the protocol seed and service rules; other atlas entries remain catalog-only.
- All protocol management output remains doctor-review-only and cannot update final records automatically.

## Local Verification

Run the current local verification suite with fake/demo data only:

```powershell
git diff --check
npm run prisma:repair
npm run prisma:seed
npm run typecheck
npm run build
npm run test:security:ci
npm run test:security:expanded
npm run test:theme:ui
npm run test:doctor:ux
npm run test:visual:qa
npm run test:e2e:v01
npm run test:clinical:persistence
npm run test:obgyn:core
npm run test:accounts:rbac
npm run test:staging:smoke
npm run test:ai:regression
npm run test:guidelines
npm run test:protocol-atlas
npm run test:ai-management
```

`npm run test:staging:smoke` requires explicit staging-script mode (`APP_ENV=staging`) even when pointed at the local fake/demo app.
# Medication Intelligence Engine

The `leap/e-medication-intelligence-engine` branch adds a unified medication catalog, herbal references, patient medication/allergy lists, draft safety checks, Egypt/Gulf market variant database, configurable country badges, source/import policy, admin controls, coverage dashboard pages, regression tests, and documentation.

The feature is a professional reference and safety-support system only. It does not provide patient self-medication guidance, pharmacy availability, retail workflows, autonomous prescribing, automatic dose changes, or AI clinical decisions.
