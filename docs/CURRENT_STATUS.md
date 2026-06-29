# Current Status

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

Protocol editor hardening is active:

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
