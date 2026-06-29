# V0.5.2 Calculators AI Mega Integration

Date: 2026-06-29

## Branches

- Integration branch: `integration/v0.5-calculators-ai-mega`
- Base branch: `origin/leap/e-ai-management-demo-guidelines-mega`
- Base commit: `a803beecbd8c43ef5cf3d950aba871559ec946e7`
- Merge source: `origin/leap/e-medical-calculator-suite`
- Source commit: `c752a62179cf32997cd5ddfad8b359f3f2f09b2d`
- Prior AI tag preserved: `v0.5.1-ai-management-mega-leap-walkthroughs`
- Prior calculator tag preserved: `v0.5-medical-calculator-suite-ob-dating`

## Scope

This was an integration-only sprint. No new product features were added beyond resolving merge conflicts and documenting the integrated release.

## Integrated Status

- Calculator suite: integrated with `CalculatorFormula`, `PatientCalculation`, formula registry seed, safe handler formula engine, `/calculators`, `/admin/calculators`, Calculator Hub UI, Admin Formula Registry UI, and calculator tests.
- OB dating: integrated with `PregnancyDatingAssessment`, `Patient.patientType`, OB dating routes, OB Dating Card, OB Dating Review Panel, Best EDD, lock/change/void workflows, and OB dating tests.
- Verified protocol packs: Emergency OB/Early Pregnancy, AUB/Menstrual, Contraception, and Routine Antenatal packs remain seeded and verified.
- AI Management Snapshot: pack-specific headings remain active. Output is deterministic, local, draft-only, doctor-review-required, and blocked for catalog-only, draft, retired, and unknown protocols.
- Guideline Center: local source registry, demo chunks, local search, extractive/mock ask, query logs, RBAC, and audit remain integrated.
- Pilot walkthroughs: owner, doctor, receptionist, accountant, clinical, finance, AI, guideline, denial, and full demo scripts pass.
- RBAC/denials: receptionist and accountant remain denied from clinical AI, guideline content, and calculator management. Admin tools remain owner/admin-only.
- Audit: calculator review/void, OB dating review/lock/change/void, AI management, guideline, protocol, clinical, billing, account, and safety-sensitive actions remain audit-covered by existing tests.

## Prisma And Database

- `npm run prisma:repair`: passed.
- `npm run prisma:migrate:deploy`: passed with 18 migrations and no pending migrations on the shared local database.
- `npm run prisma:seed`: passed.
- The local database already appeared to have the calculator migration applied. No reset, drop, or data-destructive command was used.

## Verification

Passed:

- `git diff --check`
- `npm run prisma:repair`
- `npm run prisma:migrate:deploy`
- `npm run prisma:seed`
- `npm run typecheck`
- `npm run build`
- `npm run test:security:ci`
- `npm run test:security:expanded`
- `npm run test:theme:ui`
- `npm run test:doctor:ux`
- `npm run test:visual:qa`
- `npm run test:e2e:v01`
- `npm run test:clinical:persistence`
- `npm run test:obgyn:core`
- `npm run test:accounts:rbac`
- `npm run test:finance:reports`
- `npm run test:gyn:starter`
- `npm run test:ai:regression`
- `npm run test:protocol-atlas`
- `npm run test:ai-management`
- `npm run test:calculators`
- `npm run test:ob-dating`
- `npm run test:protocol-packs`
- `npm run test:guidelines`
- `npm run test:pilot:owner`
- `npm run test:pilot:doctor`
- `npm run test:pilot:receptionist`
- `npm run test:pilot:accountant`
- `npm run test:pilot:clinical`
- `npm run test:pilot:finance`
- `npm run test:pilot:ai`
- `npm run test:pilot:guidelines`
- `npm run test:pilot:denials`
- `npm run test:pilot:demo`

Route spot checks passed for `/login`, `/dashboard`, `/patients`, `/patients/new`, patient file page, `/calculators`, `/admin/calculators`, `/protocol-atlas`, `/admin/protocol-atlas`, `/guidelines`, `/guidelines/search`, `/guidelines/ask`, `/doctor`, and `/ai-drafts`.

Safety spot checks passed:

- No raw JSON, Prisma/schema text, conflict markers, or developer text on normal checked routes.
- Patient workspace source includes AI Snapshot, OB Dating Card, OB Dating Review Panel, Pregnancy/OB, General Gynecology, Billing/Finance, and Timeline.
- Draft ultrasound formulas do not generate clinical calculator output.
- Unknown/catalog AI snapshot requests return no management options.
- Receptionist/accountant are denied guideline, AI management, and admin calculator routes.

`test:staging:smoke` was not run because this pass used `APP_ENV=local`. It remains gated on an intentionally configured staging environment.

## Warnings

- `npm ci` reported existing npm audit vulnerabilities and install-script approval warnings. Dependencies were not changed in this integration sprint.
- Security tests produced expected warnings about demo placeholders, broadly available authenticated routes, and seeded demo patient list-window behavior.
- A dev server restart attempt logged `EADDRINUSE` on port 3001 because a healthy local API was already running.

## Remaining Limitations

- Not production-ready and not a medical device.
- Fake/demo data only.
- No external AI calls.
- No automatic diagnosis, prescribing, medication dose automation, automatic FGR diagnosis, or fetal image interpretation.
- Formula verification is code-level and metadata-level only, not clinical certification.
- Guideline Center uses local demo text and metadata only; real licensed PDFs are not committed.
- Pilot walkthroughs are script-assisted, not full Playwright screenshot/click automation.
- Audit logs are application-level and not database-tamper-resistant.

## Next Sprint Recommendation

Investigations/Radiology/Lab Results Deepening + Consent/Legal Forms + Patient Document Archive.
