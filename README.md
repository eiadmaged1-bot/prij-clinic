# Prij Clinic

## v1.2.0 Mouse-First Productivity Pack

v1.2.0 adds a mouse-first doctor workflow, patient case feed, smart clinical tags, case boards, Mother-Baby pregnancy workspace, OB history tags, conception method tags, results review inbox, doctor favorites, auto-save, continue-last-work, clinic open/close checklists, waiting alerts, print helpers, guided staff help, and copyable message templates.

Routine documentation should be 95-99% mouse/touch driven, with free text as fallback. AI and clinical helper output remains draft-only until reviewed and approved by a doctor. There is no automatic diagnosis, prescribing, dosing, or treatment ranking.

Patient case feed is internal only, not social posting. Mother, Baby A, and Baby B data are separated. Conception method tags include طبيعي / تنشيط تبويض / حقن مجهري ICSI / غير معروف. Real patient data remains blocked until signoff, and external AI remains disabled by default.

## v1.0.1 Pilot Signoff Lock

v1.0.1 locks the pilot stabilization scope: universal logout/account menu, Tailscale local-dev mobile login support, receptionist clean home, Returning Patient lookup, Patient QR, and receptionist QR scan workflow.

- `/reception` now focuses on Waiting List, New Patient, and Returning Patient.
- Returning Patient lookup supports name, phone, patient ID, and MRN where available.
- Patient files show Patient QR.
- QR contains patient ID only.
- Login and RBAC are still required to resolve QR or open patient files.
- `/reception/qr-scan` supports camera scanning where the browser allows it and manual patient ID fallback where HTTPS/camera permission blocks scanning.
- Receptionist can check in/add to queue after confirmation; the QR scan does not auto-check-in.
- Tailscale support is local-dev only through `npm run dev:tailscale`; do not use Tailscale Funnel or public production exposure.
- Local firewall may need TCP `3000` and `3001` for private tailnet phone QA.
- Real patient data remains blocked and external AI remains disabled by default.

Verification:

```powershell
npm run test:v101:pilot-signoff-qr
```

## UI Cleanup + Tailscale Mobile Access + Universal Logout

This sprint keeps Prij Clinic local/private and demo-only while improving compact clinic screens, making logout visible from the top account menu for every signed-in role, and adding tailnet-only mobile development access.

Tailscale local dev:

```powershell
npm run dev:tailscale
powershell -ExecutionPolicy Bypass -File scripts/print-tailscale-dev-url.ps1
```

Open the printed `http://<tailscale-ip>:3000` URL on a phone connected to the same Tailscale account/tailnet. The API is expected at `http://<tailscale-ip>:3001/health`. Do not use Tailscale Funnel or public internet exposure. See `docs/TAILSCALE_MOBILE_ACCESS.md`.

Logout is available from the top-right account menu for Owner, Admin, Doctor, Receptionist, Nurse, and Accountant accounts. The menu shows the display name or login fallback plus a role badge.

Compact UI cleanup reduces repeated demo/safety text, keeps training/demo records behind explicit controls on normal patient/reception flows, avoids raw UUID appointment titles, and keeps sensitive intake optional/collapsed by default.

## v1.0.0 Pilot Release Candidate

v1.0.0 is the first Pilot Release Candidate package for controlled staging review. It is not a full production release and must not be used with real patient data until legal/privacy, backup/restore, deployment, and role-by-role signoff are complete.

This sprint is release packaging, final verification, documentation, and tagging only. It does not add product features, rewrite architecture, or add clinical logic.

Key commands:

```powershell
npm run staging:simulate
npm run test:v180:staging-smoke
npm run test:v180:backup-staging-readiness
npm run test:v181:browser-qa-lock
npm run test:v144:clinic-walkthrough
npm run test:v150:mvp-business-walkthrough
npm run test:v160:security-real-data-readiness
npm run test:v161:security-deployment-prep-lock
npm run test:v170:ai-safety-layer
npm run test:v170:prompt-injection-guard
npm run test:v170:safe-ai-assistant
npm run test:ai:regression
npm run test:security:ci
npm run test:security:expanded
npm run test:accounts:rbac
npm run typecheck
npm run build
```

Pilot safety boundaries: external AI is disabled by default; AI is draft-only and doctor-approved; there is no autonomous diagnosis, prescribing, dosing, treatment ranking, real payment gateway, WhatsApp, DICOM/PACS, insurance/TPA, full ledger, mobile app, or real patient data approval.

Primary v1.0.0 Pilot RC docs:

- `docs/V1_0_0_PILOT_RELEASE_CANDIDATE.md`
- `docs/PILOT_RELEASE_NOTES.md`
- `docs/PILOT_LIMITATIONS.md`
- `docs/PILOT_RUNBOOK.md`
- `docs/PILOT_QA_CHECKLIST.md`
- `docs/PILOT_RELEASE_MANIFEST.md`

## v0.18.1 Staging Browser QA Lock

v0.18.1 locks the v0.18.0 staging deployment package with browser-facing QA and final stabilization only. It does not add product features.

Key command:

```powershell
npm run test:v181:browser-qa-lock
```

Primary v0.18.1 docs:

- `docs/V0_18_1_STAGING_BROWSER_QA_LOCK.md`
- `docs/ROLE_BY_ROLE_BROWSER_QA.md`
- `docs/STAGING_BROWSER_QA_CHECKLIST.md`

Safety boundaries remain unchanged: no real patient data, no external AI by default, no autonomous diagnosis/prescribing/dosing, no fake clinical claims, no real payment gateway, no WhatsApp, no DICOM/PACS, no insurance/TPA, no full ledger, and no mobile app.

## v0.18.0 Staging Deployment Package

v0.18.0 is a staging deployment package and local production simulation sprint only. It is not a production release and must not be used with real patient data.

Key commands:

```powershell
npm run staging:simulate
npm run test:v180:staging-smoke
npm run test:v180:backup-staging-readiness
npm run staging:start
npm run staging:health-check
npm run staging:stop
```

Safety defaults:

- External AI is disabled by default with `AI_PROVIDER=disabled_mock` in staging examples and `EXTERNAL_AI_ENABLED=false`.
- AI remains draft-only until reviewed and approved by a doctor.
- `.env.staging.example` contains placeholders only; do not commit `.env.staging`, secrets, real patient data, backups, uploads, logs, reports, screenshots, or local database files.
- No payment gateway, WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, mobile app, autonomous diagnosis, autonomous prescribing, autonomous dosing, treatment ranking, or fake clinical claims are included.

Production still requires legal/privacy review, a real backup/restore drill, HTTPS, monitoring, secrets management, role-by-role browser QA, and deployment hardening.

Primary v0.18.0 docs:

- `docs/V0_18_0_STAGING_DEPLOYMENT_PACKAGE.md`
- `docs/STAGING_DEPLOYMENT_PLAN.md`
- `docs/DEPLOYMENT_COMMANDS.md`
- `docs/STAGING_SMOKE_TESTS.md`
- `docs/BACKUP_RESTORE_RUNBOOK.md`

## v0.17.1 Safe AI Review Lock

v0.17.1 locks the v0.17.0 Safe AI Assistant layer and fixes local/demo seed idempotency for queue tickets. AI remains draft-only, doctor-assist only, and requires doctor approval. External AI is disabled by default. The system does not autonomously diagnose, prescribe, dose, rank treatments, or write AI output into final clinical records.

This is not production AI. Future copy-to-record requires a separate audited, doctor-confirmed workflow.

```powershell
npm run prisma:seed
npm run test:v170:ai-safety-layer
npm run test:v170:prompt-injection-guard
npm run test:v170:safe-ai-assistant
npm run test:ai:regression
```

Primary v0.17.1 doc:

- `docs/V0_17_1_SAFE_AI_REVIEW_LOCK.md`

## v0.17.0 Safe AI Assistant Layer

v0.17.0 adds the first safe AI assistant layer: `/ai-assistant`, patient-file AI assistant panel, deterministic local summary drafts, missing-field checklist, follow-up reminder draft, patient-scoped file search, doctor approval/rejection workflow, AI audit events, and prompt-injection guard checks.

AI is assistive only. AI drafts require doctor approval. The app does not autonomously diagnose, prescribe, dose, rank treatments, send patient communications, or write AI text into final clinical records. External AI calls are disabled by default, and PHI/PII must not be sent externally unless explicit future governance is added.

```powershell
npm run test:v170:ai-safety-layer
npm run test:v170:prompt-injection-guard
npm run test:v170:safe-ai-assistant
```

Primary v0.17.0 docs:

- `docs/V0_17_0_SAFE_AI_ASSISTANT_LAYER.md`
- `docs/AI_ASSISTANT_WORKFLOW.md`
- `docs/AI_DRAFT_APPROVAL.md`
- `docs/PROMPT_INJECTION_PROTECTION.md`
- `docs/AI_AUDIT_LOGGING.md`
- `docs/AI_LIMITATIONS.md`

## v0.16.1 Security Deployment Prep Lock

v0.16.1 is staging/deployment prep, not a production release. It locks the v0.14.4 clinic walkthrough, v0.15.0 MVP business layer, and v0.16.0 security and real patient data readiness gates while adding startup, deployment prep, backup/restore runbook, role-by-role readiness, and combined regression checks.

Real patient data entry is still blocked until deployment, backup, legal/privacy, and role-by-role QA are complete. External AI remains disabled unless explicitly configured in a later reviewed sprint. AI remains doctor-assist and draft-only. There is no autonomous diagnosis, prescribing, dosing, treatment ranking, WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, real payment gateway, or mobile app.

```powershell
npm run test:v161:security-deployment-prep-lock
```

Primary v0.16.1 docs:

- `docs/V0_16_1_SECURITY_DEPLOYMENT_PREP_LOCK.md`
- `docs/DEPLOYMENT_PREP_CHECKLIST.md`
- `docs/STAGING_DEPLOYMENT_PLAN.md`
- `docs/ENVIRONMENT_VARIABLES.md`
- `docs/BACKUP_RESTORE_RUNBOOK.md`
- `docs/PRODUCTION_SAFETY_LIMITATIONS.md`

## v0.16.0 Security + Real Patient Data Readiness

v0.16.0 prepares Prij Clinic for real patient data readiness review. It does not claim full legal, compliance, operational, or production readiness, and it does not authorize real patient data entry yet.

Added readiness scope:

- API security headers, stricter production/staging env validation, audit metadata redaction, and reason-required investigation cancel/void governance.
- Owner/Admin `/admin/security-readiness` dashboard.
- Source-level readiness gates for RBAC, audit governance, backup readiness, PHI/document safety, production readiness, AI safety, and combined v0.16 regression.
- Local backup readiness only; deployed backups still require production scheduling, retention, monitoring, and restore drills.

Safety boundaries:

- No real patient data is seeded.
- No fake clinical data is added.
- AI remains doctor-assist and draft-only.
- No automatic diagnosis, prescribing, dosing, FGR diagnosis, or treatment ranking is added.
- Reviewed medication safety population remains governed separately.
- Next sprint is security stabilization + deployment prep.

```powershell
npm run test:v160:security-real-data-readiness
```

Primary docs:

- `docs/SECURITY_READINESS.md`
- `docs/REAL_PATIENT_DATA_READINESS.md`
- `docs/ROLE_PERMISSION_MATRIX.md`
- `docs/AUDIT_GOVERNANCE.md`
- `docs/BACKUP_READINESS.md`
- `docs/PHI_PII_DOCUMENT_SAFETY.md`
- `docs/PRODUCTION_READINESS_CHECKLIST.md`
- `docs/AI_SAFETY_READINESS.md`

## v0.14.4 Clinic Demo Walkthrough Lock

v0.14.4 adds a compact guided local walkthrough at `/clinic-day/walkthrough` for the connected clinic day path: owner setup, reception, patient creation, check-in, doctor waiting, patient profile, doctor visit draft, prescription draft, investigation request, follow-up, and patient packet printing.

```powershell
npm run test:v144:clinic-walkthrough
```

This remains local/demo only. Do not use real patient data. No external AI, WhatsApp, DICOM/PACS, insurance, real payment gateway, autonomous diagnosis, auto-prescribing, auto-dosing, or production-readiness claim is added. AI and Care Assist remain draft-only and doctor-review-only.

## v0.13.0-v0.14.0 Clinic Operations + Documents + OB/GYN Deepening Mega Sprint

This sprint skips the dedicated v0.12.9 QA sprint and adds a staged clinic operations leap: reception daily workspace, calendar/queue/doctor handoff, service/invoice visit links, investigation handoff, documents/results timeline, patient timeline, pregnancy episode deepening, fetus/multiple pregnancy starter, antenatal visit recording, OB ultrasound structured report starter, daily clinic reports, and a demo clinic day script.

```powershell
npm run test:v13:clinic-day-loop
npm run test:v14:obgyn-deepening
npm run test:v14:no-unsafe-obgyn-automation
```

Manual browser QA is deferred to the user after this mega sprint. This is not production-ready. Do not use real patient data. No WhatsApp, DICOM/PACS, insurance/TPA, external AI runtime calls, real payment gateway, automatic diagnosis, prescribing, dosing, FGR diagnosis, anomaly interpretation, treatment ranking, or fetal image AI were added. AI remains doctor-assist and draft-only. Reviewed medication safety population remains a governed workstream.

## v0.12.8 Owner Control Center + General Gynecology Starter

v0.12.8 adds the staged Owner Control Center shell, Owner/Admin service price catalog controls, safe reason-required owner override actions, a focused patient workspace Gynecology tab, and recording-only general gynecology starter templates.

```powershell
npm run test:v128:owner-control-gyn
```

Service/price catalog entries are clinic billing settings only. Gynecology starter templates are recording aids only. There is no automatic diagnosis, prescribing, dosing, treatment ranking, contraception recommendation, real payment gateway, insurance/TPA, DICOM/PACS, WhatsApp, external AI runtime call, or real patient data. Real production use still requires security, legal, privacy, consent, backup, deployment, and clinical governance readiness.

## v0.12.7 Demo Candidate Stabilization

v0.12.7 stabilizes the current accelerated branch into a local demo candidate. It adds browser QA locks for app startup, API health, login, synthetic patient creation, patient workspace, doctor visit flow, generic-first prescription workflow, medication safety terminal, medication safety source review/import page protection, investigations, follow-up, packet visibility, RBAC denials, and normal UI wording.

```powershell
npm run test:v127:demo-candidate-browser
npm run test:v127:no-code-ui
```

No fake clinical claims, fake medication safety claims, autonomous diagnosis, prescribing, dosing, treatment ranking, external AI runtime calls, WhatsApp, DICOM/PACS, insurance, or real payment gateway were added. Medication safety source import exists, but reviewed source population remains a separate governed workstream. AI remains doctor-assist and draft-only. Real patient use still requires production security, legal, privacy, consent, backup, deployment, and clinical governance readiness.

## v0.12.6 Medication Safety Source Import + Review Workflow

v0.12.6 adds Owner/Admin controlled medication safety source file preview, import commit, review queue, and approve/reject/retire decisions for pregnancy/lactation profile metadata.

Imported rows are `needs_review` by default. Reviewed status requires source metadata and reviewer action with a reason. The workflow does not create fake pregnancy/lactation claims and does not automate prescribing, dosing, diagnosis, or treatment ranking. Real reviewed source population remains a separate governed workstream.

```powershell
npm run db:v126:import-med-safety
npm run test:v126:med-safety-review
```

## v0.12.5 Clinic Usability Lock + Source Review Prep

v0.12.5 focuses on browser usability and medication safety source review prep. It tightens the path from login to patient creation, patient workspace, doctor visit, history, Care Assist, encounter, prescription, medication safety terminal, investigations, follow-up, and packet.

No fake pregnancy/lactation safety claims were added. Source review is prepared, not fully populated. Doctor approval is required, with no autonomous diagnosis, prescribing, dosing, or final plan generation. Real reviewed data import is next.

```powershell
npm run test:v125:clinic-usability-lock
```

## v0.12.4 Doctor Visit Flow + Care Assist E2E

v0.12.4 connects history sheets, Care Assist, encounter drafts, generic-first prescription drafting, pregnancy/lactation safety profile visibility, investigation requests, follow-up tasks, clinical note buttons, and printable visit packets into one patient workspace Doctor Visit flow.

```powershell
npm run prisma:migrate:deploy
npm run prisma:generate
npm run test:v124:doctor-visit-flow
npm run test:v124:clinical-safety-wording
npm run typecheck
npm run build
```

Care Assist remains completeness/safety review only. Clinical hints are doctor-facing notes only. There is no autonomous final diagnosis, autonomous prescribing, default dosing automation, category E, safe-in-pregnancy wording, or up-to-date-today claim without persisted source refresh metadata.

Clinic Management System V0.9 visible local/private clinic OS sprint for OB/GYN and women’s health workflows.

V0.9 focuses on browser-visible product experience: premium login, role-aware dashboard, patient creation, central patient workspace, reception-to-doctor-to-finance flow, appointment/calendar/queue polish, Owner Control Center, service/price catalog visibility, finance basics, orders skeleton, consent/legal skeleton, and polished medication reference visibility for existing official data.

It remains local/demo only and must not be used with real patient data, real payment details, production credentials, autonomous AI decisions, or patient medication instructions.

## v0.12.3 Care Assist + Pregnancy/Lactation Safety

v0.12.3 adds Care Assist for missing-field reminders, follow-up review, and pregnancy/lactation medication safety profile visibility.

```powershell
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:v123:seed:care-assist
npm run db:v123:med-safety:ready
npm run test:v123:care-assist-safety
```

Care Assist does not diagnose, prescribe, choose drugs, generate dose/frequency/duration, rank treatments, or create a final clinical plan. Pregnancy A/B/C/D/X are legacy reference categories only. There is no category E; imported E maps to `REVIEW_REQUIRED`. Lactation uses narrative/profile fields, not a single universal letter category. Unknown or missing source data is shown as review required, and doctor review is mandatory.

## v0.12.2 Clinical Reference + History Workspace

v0.12.2 adds generic medication reference lookup, investigation and operation catalog search, structured OB/GYN history sheets, and generic-name prescription selection.

```powershell
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:v122:seed:clinical-reference
npm run test:v122:clinical-reference
```

Medication reference remains generic-name only: no trade names, brand names, pricing, inventory, stock, sales, dosing automation, AI prescribing, or treatment ranking. Investigation catalog usage is for requests/history only, operation catalog usage is for past surgical history only, and patient history sheets are structured documentation only.

## v0.12.1 Clean Local Database Baseline

Use the v0.12.1 commands to inspect, clean, seed reference catalogs, and verify a local/development clinic baseline without fake operational patient data.

```powershell
npm run db:v121:inventory
npm run db:v121:baseline:dry-run
$env:APP_ENV="local"
npm run db:v121:baseline:apply
npm run db:v121:verify-clean
npm run db:v121:medications:ready
```

The cleanup preserves users, roles, permissions, owner/admin accounts, branches, audit logs, migrations, guideline/protocol rows, medication/drug-market reference rows, and reference catalogs. Generated reports are written under ignored `storage/local-db-reports/`.

Medication data is not invented. If official medication rows are zero, readiness reports a warning until approved official sources are imported.

## v0.11.5 Real App Tailscale Responsive Login

The real Next.js app shell now keeps desktop navigation in a fixed left rail at `>=1200px` and uses a topbar/drawer below that, including phone widths. Dashboard Patient Search is bounded to normal input/card sizing, and `/prescriptions` starts under the shell without a large navigation panel above it.

For phone testing through the exact Tailscale host:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-lan-profile.ps1 -HostIp 100.127.4.46
```

Open `http://100.127.4.46:3000`; the browser API base is explicitly configured as `http://100.127.4.46:3001`. CORS remains exact-origin only; no wildcard or broad Tailscale subnet is allowed. See `docs/V0_11_5_REAL_APP_TAILSCALE_RESPONSIVE_LOGIN.md`.

## v0.10.5 LAN CORS Hardening

Branch: `security/v0.10.5-lan-cors-hardening`.

LAN development now uses explicit API/CORS profiles. Prefer a configured LAN API origin such as `NEXT_PUBLIC_LAN_API_ORIGIN=http://192.168.1.50:3001` or `http://prij-clinic.local:3001`, paired with exact backend `CORS_ORIGINS`.

Development-only private subnet matching is configured with `CORS_PRIVATE_CIDRS` and `CORS_PRIVATE_PORTS`. Do not use CIDR, wildcard origins, or dynamic LAN fallback in staging or production. Staging and production must use exact HTTPS origins.

Regression checks:

```powershell
npm run test:web:api-base
npm run test:security:cors
```

See `docs/LAN_DEV_CORS_HARDENING.md`.

## v0.10.4 Mobile-Stable Static HTML Lab

Branch: `ui/v0.10.4-mobile-stable-html-lab`.

v0.10.4 rebuilds the static HTML theme lab as one mobile-first handoff shell at `ui-export/index.html`. It opens to Dashboard, uses section/hash navigation without API calls, and includes a phone drawer, local theme switching, mobile-safe cards/tables, and designer handoff docs.

Static lab commands:

```powershell
npm run design:export-html
npm run design:serve-html
npm run design:test-mobile-html
npm run design:package-html
```

Use `npm run design:serve-html` for phone testing; it serves only `ui-export` and prints localhost plus LAN URLs. No real auth, patient data, medication data, secrets, uploads, API/database access, external AI, release tag, or production-ready claim is included.

## v0.10.2 Mobile Browser Usability + LAN Phone QA

Branch: `ui/v0.10.2-mobile-browser-usability`.

v0.10.2 makes the local demo usable from phone browsers over LAN. Desktop keeps the sidebar; phone/tablet widths use a topbar menu button and slide-out drawer. Forms, cards, patient tabs, admin pages, guideline/protocol browsing, and drug-market import status are hardened against small-screen horizontal overflow.

LAN testing:

```powershell
ipconfig
npm run dev
```

Open `http://PC_IP:3000` on a phone on the same Wi-Fi and verify `http://PC_IP:3001/health`. See `docs/MOBILE_LAN_TESTING.md` and `docs/MANUAL_QA_MOBILE_CHECKLIST.md`.

Mobile QA:

```powershell
npm run test:v102:mobile
```

No medication data, fake official rows, external AI, real patient data, payment gateway, production CORS weakening, or release tag is added.

## v0.10.1 Official Medication Import Operator

Branch: `data/v0.10.1-official-medication-import-operator`.

The old project medication artifact is unavailable and cannot be recovered from current project artifacts. v0.10.1 prepares the app for a real authorized official-medication import session without creating fake rows or generated medication data.

Local inbox:

```powershell
storage/official-medication-sources/
```

Operator commands:

```powershell
npm run medication:v101:import-status
npm run medication:v101:operator -- -Scan
npm run medication:v101:operator -- -DryRun -Source NHRA -Country BH -File "PATH"
$env:APP_ENV="local"
npm run medication:v101:operator -- -Apply -ConfirmApply -Source NHRA -Country BH -File "PATH"
npm run medication:v097:ready-check:strict
npm run prescriptions:v097:medication-selection-check
```

Official rows remain 0 until authorized official files are added and applied. Prescription medication selection remains blocked until verified or needs_review official rows exist. Imported strength/form/pack is market metadata only; doctors manually write patient directions. Do not use fake data, stock/order/checkout sources, real patient data, external AI, or release tags for this sprint.

## v0.10.0 Official Medication Re-Import

Branch: `data/v0.10.0-official-medication-reimport`.

v0.10.0 prepares a safe re-import path for official medication reference data after v0.9.7-v0.9.9 found no recoverable old raw export or DB artifact. The first targets are Bahrain NHRA and Oman MOH, matching the earlier project history of 8,269 official rows. The current local DB still has 0 official medication rows and 0 verified medication rows.

```powershell
npm run medication:v100:source-list
npm run medication:v100:source-acquire -- --file PATH --source NHRA --country BH --apply
npm run medication:v100:reimport:dry-run -- --source NHRA --country BH --file PATH
$env:APP_ENV="local"
npm run medication:v100:reimport:apply -- --source NHRA --country BH --file PATH
```

Rows default to `needs_review` unless an approved file explicitly contains prior project `verificationStatus=verified`. The workflow does not create fake rows, scrape retail/stock/order/checkout pages, generate dosing instructions, auto-prescribe, or commit raw official files.

## v0.9.9 Medication Provenance Recovery

Branch: `data/v0.9.9-medication-provenance-recovery`.

v0.9.9 searches project-owned artifacts for the previously imported Bahrain/Oman official medication reference data before asking for a new owner export. It adds read-only provenance scanning plus guarded recovery-DB export/import helpers.

```powershell
npm run medication:v099:provenance
npm run medication:v099:export-from-recovery-db
npm run medication:v099:import-recovered:dry-run
```

Current result: no recoverable raw official export or old running DB with official rows was found. Local official medication rows remain 0, verified rows remain 0, and no fake rows were created.

## v0.9.7 Reference Data Restore + Prescription Trial Readiness

Branch: `data/v0.9.7-reference-data-restore-prescription-readiness`.

v0.9.7 prepares the cleaned local demo database for reference-data manual QA. It can discover prior official medication exports, dry-run or apply guarded restore of official medication reference metadata, verify medication/guideline readiness, prove prescription draft reference selection without dosing automation, and verify `eyad` account creation/Receptionist denials.

```powershell
npm run db:v097:prepare-reference
npm run medication:v097:find-sources
npm run medication:v097:restore:dry-run
npm run medication:v097:ready-check
npm run guidelines:v097:ready-check
npm run accounts:v097:role-ready-check
```

Apply medication restore only with explicit local confirmation:

```powershell
$env:APP_ENV="local"
npm run medication:v097:restore:apply
```

No fake official medication data, patient dosing automation, external AI, stock/order/checkout behavior, real patient data, or release tag is added.

## v0.9.6 Local Demo Database Finalization

Branch: `data/v0.9.6-local-demo-db-finalization`.

v0.9.6 finalizes the local/demo database state for manual QA using the guarded v0.9.5 cleanup. The local dry run targeted 602 clearly demo/test/local patients and linked operational records; cleanup apply reduced those patient-linked operational rows to 0 while preserving users, roles, permissions, `eyad`, audit logs, the 63-row investigation catalog, medication reference/drug-market tables when present, service catalog, and setup/reference data.

```powershell
npm run db:v096:report
npm run db:v096:ready-check
```

Generated finalization reports are local ignored artifacts under `storage/local-db-finalization/` and must not be committed.

Known local warning: official medication rows are absent in this local DB. Restore/import approved official medication data instead of creating fake official rows.

No release tag has been created, and manual browser QA is still required.

## v0.9.5 Data Hygiene + Reference Catalog + Eyad Account Authority

Branch: `data/v0.9.5-clean-reference-data-account-authority`.

v0.9.5 adds guarded local/demo database audit and cleanup scripts, an investigation reference catalog seed, reference-data preservation checks, and clearer protected `eyad` System Owner account authority. It is not a release and creates no tag.

```powershell
npm run db:v095:audit
npm run db:v095:clean:dry-run
npm run db:v095:verify-reference
npm run db:v095:seed-investigations
```

Apply cleanup only after reviewing dry-run output and only in local/dev/test/CI demo databases:

```powershell
APP_ENV=local npm run db:v095:clean:apply
```

Cleanup targets only clearly demo/test/local patient-linked operational records. It preserves medication reference data, official drug-market metadata, investigation catalog rows, roles/permissions, audit logs, and the protected `eyad` account.

## v0.9.3 Release Candidate

Branch: `hardening/v0.9.3-automated-qa-stabilization`.

CI Release Gate and normal CI have passed, but v0.9.3 is not released yet. The release tag remains blocked until final local Docker/PostgreSQL validation and manual browser QA both pass.

## v0.9.4 Automated Browser Journey QA

Branch: `qa/v0.9.4-automated-browser-journey`.

v0.9.4 adds Playwright Chromium browser journeys for login, dashboard, fake/demo patient creation, patient workspace tabs, clinic workflow pages, medication/drug-market declutter, and role visibility. It is automated QA infrastructure only. It does not release v0.9.3, does not create a release tag, and does not replace final manual browser QA.

Run locally after the API, web app, PostgreSQL, migrations, and seeded demo data are available:

```powershell
npm run test:v094:browser
npm run test:v094:browser:report
```

The GitHub Actions workflow is `.github/workflows/v094-browser-journey.yml`.

Final local release validation:

```powershell
npm run dev:diagnose
npm run test:v093:release
```

v0.9.3 automated QA stabilization is not released yet. Docker/PostgreSQL blocked the DB/API-backed validation on the remote machine, so no release tag has been created. The final tag `v0.9.3-automated-qa-stabilization` is forbidden until `npm run test:v093:patient-create` and `npm run test:v093:roles` pass without `V093_ALLOW_ENV_SKIP=1`.

The dedicated GitHub Actions workflow `v0.9.3 Release Gate` runs on the hardening branch, pull requests targeting `ui/v0.9.2-prij-heritage-theme-and-medication-declutter`, and manual dispatch. It uses a demo-only PostgreSQL 16 service database, applies migrations, seeds demo data, starts the built API and web app, and runs the v0.9.3 automated QA without `V093_ALLOW_ENV_SKIP=1`. It does not create a release tag and does not replace final local/manual browser QA.

Earlier foundation: V0.7 unified local/private sprint for OB/GYN, general gynecology, demo finance workflows, medical calculators, OB dating, protocol-backed AI Management Snapshots, the local Guideline Center, Medication Intelligence Engine v2 framework, and official medication metadata workflows.

V0.7 clinic workflow spine adds investigation result metadata, critical-result acknowledgement, metadata-only patient document archive, consent templates/demo signatures, referrals, patient tasks, internal notes, provider/department directories, timeline integration, dashboard workflow counts, and browser print packets. It remains local/demo only and must not be used with real patient data or PHI files.

V0.7 includes the Medication Intelligence Engine v2 framework. It is not a complete Egypt/GCC real market database yet; official source import and verification are still required. Retail metadata connectors remain disabled by default, imported market records stay review-gated until verified, and strength/form/pack fields are market metadata only, never patient dosing instructions.

V0.8.3 Batch 1 verifies the first 100 high-confidence Bahrain NHRA official medication rows while preserving all 8,269 Bahrain/Oman real official rows and 23 excluded demo rows. Oman remains review-gated because current PDF parser confidence is below the high-confidence verification threshold. See `docs/OFFICIAL_MEDICATION_VERIFICATION_BATCH_1.md`.

V0.8.4 Batch 2 improves the Oman MOH parser, extracts defensible structured strength/form/pack metadata for many rows, and verifies 100 strict high-confidence Oman official medication rows. Totals remain 8,269 real official rows, with 100 Bahrain verified rows preserved, 100 Oman verified rows, and 23 demo rows excluded. See `docs/OFFICIAL_MEDICATION_VERIFICATION_BATCH_2_OMAN.md`.

V0.8.5 Batch 3 preserves all 8,269 Bahrain/Oman real official rows, adds local official-medication data export/verify/restore scripts, and verifies 200 additional Bahrain plus 200 additional Oman high-confidence rows. Totals are now 600 verified official rows, 7,669 open review items, and 23 excluded demo rows. Qatar/Kuwait/SFDA remain safe diagnostics or owner-provided official file intake only. See `docs/OFFICIAL_MEDICATION_DATA_PRESERVATION.md` and `docs/OFFICIAL_MEDICATION_VERIFICATION_BATCH_3.md`.

V0.8.6 Batch 4 proves official medication disaster recovery with an isolated restore drill against `prij_clinic_medication_restore_test` and verifies 300 additional Bahrain plus 300 additional Oman high-confidence rows. Totals remain 8,269 real official rows, with 1,200 verified official rows, 7,069 open review items, 6,998 high-confidence candidates remaining, 71 low-confidence/blocked Oman rows, and 23 excluded demo rows. See `docs/OFFICIAL_MEDICATION_RESTORE_DRILL.md` and `docs/OFFICIAL_MEDICATION_VERIFICATION_BATCH_4.md`.

The v0.7 medication intelligence source-of-truth audit is documented in `docs/V0_7_MEDICATION_INTELLIGENCE_AUDIT.md`. The next medication-data sprint is Official Medication Data Import Pack 1 - Egypt + Saudi Arabia.

Current foundation includes hardened accounts/session/RBAC, audit logs, patients, consent records, appointments, queue, encounters, prescriptions, investigations, reports, general gynecology starter records, pregnancy records, OB ultrasound records, OB dating assessments, deterministic calculator history, billing, payments, service catalog, daily closing, patient statements, owner finance reports, dashboard summary, disabled AI draft placeholders, local protocol-backed AI Management Snapshots, guideline/evidence library metadata, local backup helpers, and CI/security tests.

V0.6 is a unified local/private integration of the AI Management Mega Leap branch, Medical Calculator Suite branch, and Medication Intelligence Engine branch. It is not production-ready, not a medical device, and must not be used with real patient data.
Current foundation includes hardened accounts/session/RBAC, audit logs, patients, consent records, appointments, queue, encounters, prescriptions, investigations, reports, general gynecology starter records, pregnancy records, OB ultrasound records, billing, payments, service catalog, daily closing, patient statements, owner finance reports, secure Guideline Center, guideline source registry, private guideline vault controls, dashboard summary, disabled AI draft placeholders, local backup helpers, and CI/security tests.

V0.3 is a verified local/private integration of the locked MVP pilot workflow, finance/report deepening, general gynecology starter, and secure Clinical Guideline Center. It is not production-ready, not a medical device, and must not be used with real patient data.

The local Clinical Guideline Center supports owner/admin/doctor evidence-library workflows, source registry metadata, private licensed upload storage, local text extraction/chunking, citation search, and mock/local RAG answers from indexed chunks only. It does not call external AI providers and does not modify clinical records.

The locked pilot flow is:

```text
Owner login -> patient file -> Pregnancy/OB or General Gynecology -> Billing/Finance -> timeline -> print -> role-safe account behavior
```

## V0.1 Focused Clinic Workflow

The web app is now organized around the clinic workflow the pilot needs:

- Login with seeded demo credentials.
- Open Dashboard for a short operational overview.
- Open Patients.
- Create a New Patient File.
- Open the patient file and work from that patient-scoped workspace.
- Use module pages only for their focused workflow: appointments, queue, encounters, prescriptions, investigations, reports, pregnancy/ultrasound, billing, consents, and AI draft placeholders.
- Use Admin Control Center for local demo settings, staff/role visibility, service prices, safe overrides, system status, audit review, and appearance settings.
- Use Billing for catalog-linked invoices, manual payments, refunds/voids, daily closing, patient statements, and owner finance reports without a real payment gateway.
- Doctors can use Doctor Mode for a simpler daily workflow: open patient, start visit, write note, prescribe, order tests, finish, and move to the next patient.
- Patient files now use simplified tabs, large actions, and 3D-style medical icons for older-doctor-friendly recognition.
- Patient files now include a General Gynecology workspace with recording-only visit templates for abnormal bleeding, pelvic pain, PCOS, fibroid or ovarian cyst, and contraception counseling.

Every UI surface remains demo/local only: no real patient data, no real payment gateway, no production PHI upload, and no external AI calls.

## V0.6 Unified Status

- Medication Intelligence Engine is integrated with medication families, ingredients, products, label sections, herbal references, patient medication/allergy lists, draft medication safety checks, and drug-market country/source/product/variant metadata.
- Calculator, OB dating, protocol atlas, AI management, and guideline center workflows remain integrated from the v0.5 calculator/AI mega work.
- Patient workspace tabs remain role-aware and focused, including medication, allergy, herbal/supplement, medication safety, prescription safety, AI snapshot, OB/GYN, finance, guideline/protocol, and calculator-related views.
- Marketed medication strength/form/package data is market metadata only and is never patient dosing instruction text.
- AI and medication safety outputs remain doctor-review support only and cannot diagnose, prescribe, sign, approve, or update final signed records.

See `docs/V0_6_MASTER_UNIFIED_AUDIT.md`.

## v0.12.0 Real App Clinic Workspace Upgrade

Branch: `leap/v0.12.0-real-app-clinic-workspace-upgrade`.

v0.12.0 upgrades the real Next.js app workspace toward the approved v0.11 premium clinic UI while preserving v0.11.5 security/runtime/schema hardening. The real app shell now uses clinic workflow navigation groups, adds reusable clinic/layout primitives, improves shared workflow pages, and adds no-fake-UI plus real-app workspace browser checks.

Run:

```powershell
npm run test:v120:no-fake-ui
npm run test:v120:workspace
```

Phone QA:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-lan-profile.ps1 -HostIp 100.127.4.46
```

No schema, CORS, auth/RBAC, audit, Tailscale/LAN, image metadata, upload policy, queue-date, encounter-branch, or encounter-voiding behavior is weakened. AI remains draft-only, prescriptions remain doctor-controlled, and Drug Market remains reference/import/review only.

## V0.5.2 Integration Status

- Medical Calculator Suite is integrated with `CalculatorFormula`, `PatientCalculation`, formula registry, safe handler-based formula engine, `/calculators`, `/admin/calculators`, calculator tests, and admin RBAC.
- OB dating is integrated with `PregnancyDatingAssessment`, patient type support, OB Dating Card, OB Dating Review Panel, Best EDD, lock/change/void workflows, and OB dating tests.
- AI Management Mega is integrated with verified Emergency OB/Early Pregnancy, AUB/Menstrual, Contraception, and Routine Antenatal protocol packs.
- AI Management Snapshots remain deterministic, local, draft support only, and blocked for catalog-only/draft/retired/unknown protocols.
- Guideline Center is integrated as a local evidence library with source registry, demo chunks, local search, extractive/mock ask, query logs, RBAC, and audit.
- Pilot walkthrough scripts cover owner, doctor, receptionist, accountant, clinical, finance, AI, guidelines, denials, and full demo flows.

See `docs/V0_5_CALCULATORS_AI_MEGA_INTEGRATION.md`.

Release-candidate verification and production-readiness planning are documented in:

- `docs/MVP_PILOT_WORKFLOW_LOCK_REPORT.md`
- `docs/MVP_RC_VERIFICATION_CHECKLIST.md`
- `docs/PRODUCTION_READINESS_PLAN.md`
- `docs/STAGING_DEPLOYMENT_RUNBOOK.md`
- `docs/SECURITY_HARDENING_CHECKLIST.md`
- `docs/RELEASE_GATE_CHECKLIST.md`
- `docs/OPERATIONS_MONITORING_PLAN.md`
- `docs/DATABASE_DEPLOYMENT_WORKFLOWS.md`
- `docs/VPS_STAGING_DEPLOYMENT_TRIAL.md`
- `docs/V0_3_FINANCE_GYN_INTEGRATION.md`
- `docs/V0_5_CALCULATORS_AI_MEGA_INTEGRATION.md`
- `docs/V0_3_FINANCE_GYN_GUIDELINE_INTEGRATION.md`

## Safety Rules

- Do not use real patient data in development, tests, screenshots, seeds, or docs.
- Do not commit secrets, API keys, passwords, tokens, reports, backups, or patient data.
- AI external access is disabled. AI draft placeholders are metadata-only, disabled, and draft-only.
- AI cannot diagnose, prescribe, sign records, approve clinical records, override RBAC, or bypass doctor approval.
- Clinical output must remain doctor-authored or doctor-reviewed before use.
- Clinical writes, billing changes, report review, and AI draft review placeholders are audit logged.
- OB ultrasound records do not automatically diagnose FGR or any other condition.

## Stack

- Monorepo with npm workspaces
- `apps/web`: Next.js frontend
- `apps/api`: NestJS API
- PostgreSQL via Docker Compose
- Prisma ORM in `apps/api`

## Local Setup

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d postgres
npm run prisma:repair
npm run prisma:seed
```

Edit `.env` locally. Use real local values only in `.env`, never in `.env.example`.

Required local variables:

```powershell
API_PORT=3001
APP_ENV=local
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your-local-dev-secret
JWT_EXPIRES_IN=1h
GUIDELINE_VAULT_ENCRYPTION_KEY=
GUIDELINE_VAULT_ENCRYPTION_KEY_ID=local-dev-key
DEMO_OWNER_EMAIL=owner@prij.local
DEMO_OWNER_PASSWORD=LocalDev123!
SEED_DEMO_OWNER=true
SEED_DEMO_DATA=true
```

Primary local demo admin login:

```text
Admin ID: eyad
Password: eyad
```

This credential is local demo only and is forbidden outside a local/private demo database.

Staging demo credentials must use different staging-only passwords. Production must set `SEED_DEMO_DATA=false` and `SEED_DEMO_OWNER=false`; production must not create `eyad` / `eyad`.

Other demo accounts are local-only and use the default password `LocalDev123!` unless overridden.

```text
Demo Owner:        demo.owner@prij.local       / LocalDev123!
Demo Doctor:       demo.doctor@prij.local      / LocalDev123!
Demo Reception:    demo.reception@prij.local   / LocalDev123!
Demo Accountant:   demo.accountant@prij.local  / LocalDev123!
Demo Nurse:        demo.nurse@prij.local       / LocalDev123!
```

Seed data uses only demo records such as `Demo Patient A`.

## Development

```powershell
npm run dev
```

Stop local dev ports:

```powershell
npm run dev:stop
```

Open:

```text
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/dashboard
http://localhost:3000/doctor
http://localhost:3000/doctor/visit
http://localhost:3000/admin
http://localhost:3000/patients
http://localhost:3000/patients/new
http://localhost:3000/appointments
http://localhost:3000/calendar
http://localhost:3000/queue
http://localhost:3000/encounters
http://localhost:3000/prescriptions
http://localhost:3000/investigations
http://localhost:3000/reports
http://localhost:3000/documents
http://localhost:3000/referrals
http://localhost:3000/tasks
http://localhost:3000/pregnancies
http://localhost:3000/ultrasound
http://localhost:3000/billing
http://localhost:3000/consents
http://localhost:3000/calculators
http://localhost:3000/ai-drafts
http://localhost:3000/guidelines
http://localhost:3000/guidelines/search
http://localhost:3000/guidelines/ask
http://localhost:3000/guidelines/upload
http://localhost:3000/protocol-atlas
http://localhost:3000/admin/calculators
http://localhost:3000/admin/protocol-atlas
http://localhost:3000/guidelines
http://localhost:3000/guidelines/search
http://localhost:3000/guidelines/ask
http://localhost:3000/medications
http://localhost:3000/medications/search
http://localhost:3000/drug-market
http://localhost:3000/drug-market/search
http://localhost:3000/admin/medications
http://localhost:3000/admin/drug-market
```

Recommended demo flow:

```text
Login -> Dashboard -> Patients -> New Patient File -> Save and open patient file -> patient file tabs -> appointment -> queue -> encounter -> prescription -> investigation -> pregnancy/ultrasound/report -> billing -> consent -> AI draft placeholder
```

Doctor-friendly demo flow:

```text
Login -> Doctor Mode -> Open Patient -> Start Visit -> Complaint -> History -> Examination -> Impression -> Prescription -> Orders -> Follow-up -> Finish Visit
```

Admin demo flow:

```text
Login as eyad -> Admin -> Accounts or Service Catalog and Prices -> create demo staff account or edit price -> Appearance -> choose theme -> review Audit Log Viewer
```

Safe admin overrides are reason-required and audited. The app supports void/cancel/archive style corrections only; audit logs and signed clinical records cannot be deleted from the normal UI.
The `eyad` account is the protected local demo System Owner. Normal UI/API flows cannot create a second System Owner, grant reserved System Owner permissions to another account, deactivate `eyad`, or demote `eyad`.

Theme and appearance controls:

1. Sign in as `eyad` / `eyad`.
2. Open `Admin`.
3. Open `Appearance`.
4. Choose Original Premium, Clinic Portal, Incision Portal, Minimal Clean, or Compact Operations.
5. Use `Use here` for this browser, or `Set as default` to save the local demo default.

The Admin and Appearance navigation is hidden for non-admin staff. The server also protects the appearance settings API with admin permissions, and setting changes are audited.

Patient file creation:

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000/login`.
3. Click `Use demo login`, then sign in.
4. Open `Patients`.
5. Click `New Patient File`.
6. Use fake/demo details only and click `Save and open patient file`.
7. Continue work from `/patients/:id`, where each tab is scoped to that patient where current APIs support it.

## Current Endpoints

Health:

```text
GET /health
GET /health/db
```

Auth/admin/audit:

```text
POST /auth/login
GET  /auth/me
POST /auth/logout
GET  /admin/users
GET  /admin/accounts
POST /admin/accounts
PATCH /admin/accounts/:id
POST /admin/accounts/:id/reset-password
POST /admin/accounts/:id/deactivate
POST /admin/accounts/:id/activate
POST /admin/accounts/:id/reactivate
PATCH /admin/accounts/:id/permissions
GET  /admin/roles
GET  /admin/permissions
GET  /audit
```

MVP workflows:

```text
GET  /patients
GET  /consents?patientId=:id
POST /consents
GET  /appointments
GET  /appointments/calendar
GET  /queue/today
GET  /encounters
GET  /prescriptions
GET  /investigations/orders
GET  /reports
GET  /gynecology-visits
GET  /patients/:id/gynecology-visits
POST /patients/:id/gynecology-visits
GET  /pregnancies
GET  /ob-ultrasounds
GET  /billing/invoices
GET  /billing/services
GET  /billing/daily-closing
GET  /billing/reports/finance
GET  /billing/patients/:patientId/statement
GET  /billing/payments
GET  /dashboard/summary
GET  /ai-drafts
GET  /calculators/formulas
POST /calculators/calculate
GET  /calculators/history/patient/:patientId
POST /calculators/ob/dating/calculate
GET  /calculators/ob/patient/:patientId/current
POST /calculators/ob/dating/:id/set-best
POST /calculators/ob/dating/:id/lock
GET  /admin/calculators
GET  /guidelines/documents/:id/view
GET  /guidelines/documents/:id/download
PATCH /guidelines/documents/:id/file-access-settings
GET  /protocol-atlas
GET  /protocol-atlas/groups
GET  /protocol-atlas/:id
GET  /protocol-atlas/by-code/:code
POST /protocol-atlas/search
PATCH /protocol-atlas/:id/status
GET  /protocol-atlas/:id/editor
PATCH /protocol-atlas/:id/source
PATCH /protocol-atlas/:id/aliases
PATCH /protocol-atlas/:id/structured-content
POST /protocol-atlas/:id/request-verification
POST /protocol-atlas/:id/verify
POST /protocol-atlas/:id/retire
POST /ai-management/snapshots
GET  /ai-management/snapshots
GET  /ai-management/snapshots/:id
POST /ai-management/snapshots/:id/review
POST /ai-management/snapshots/:id/save-memory
```

## Verification

```powershell
npm run prisma:repair
npm run prisma:seed
npm run typecheck
npm run build
```

v0.9.3 automated browser-free QA:

```powershell
npm run dev:diagnose
npm run test:v093:routes
npm run test:v093:ui-text
npm run test:v093:patient-create
npm run test:v093:medication-ui
npm run test:v093:roles
```

`test:v093:routes` and the runtime portion of `test:v093:medication-ui` expect the local Next web app to be reachable. `test:v093:patient-create` and `test:v093:roles` expect the local API, PostgreSQL, and seeded demo data to be reachable. These checks use fake/demo data only.

When Docker/PostgreSQL are available, run the final validation gate:

```powershell
npm run test:v093:release
```

`V093_ALLOW_ENV_SKIP=1` can convert unavailable API/PostgreSQL failures in the API-backed v0.9.3 checks into a local skip/warn exit 0. That mode is not release-validating, and the release tag must not be created until the checks pass without it.

GitHub Actions CI gate for v0.9.3:

```text
.github/workflows/v093-release-gate.yml
```

The workflow uses a CI PostgreSQL service and must fail if the API/DB-backed checks cannot run. Do not add `V093_ALLOW_ENV_SKIP=1` to this workflow. The release tag remains forbidden until this CI gate and final local DB/API plus manual browser validation pass.

## CI

GitHub Actions runs basic CI on `push` and `pull_request` using Node.js 22:

```text
npm ci
npm run prisma:generate
npm run typecheck
npm run build
```

Full local V0.1 check, after starting API and web:

```powershell
npm run smoke:test
npm run test:security
npm run test:security:ci
npm run test:security:expanded
npm run test:theme:ui
npm run test:doctor:ux
npm run test:e2e:v01
npm run test:clinical:persistence
npm run test:gyn:starter
npm run test:visual:qa
npm run test:accounts:rbac
npm run test:finance:reports
npm run test:calculators
npm run test:ob-dating
npm run test:guidelines
npm run test:integrated:probes
```

Security integration CI is handled by a separate workflow, `Security Integration Tests`, on `workflow_dispatch`, `pull_request`, and pushes to `security/**`, `tests/**`, `ci/**`, and `auto/**`.

That workflow starts a PostgreSQL 16 service container, applies existing Prisma migrations with `npm run prisma:migrate:deploy`, seeds demo-only data, starts the API, and runs:

```text
npm run test:security:ci
```

The CI security runner is API-only. It does not start the Next.js web app, does not use real patient data, does not call external AI providers, and does not certify production readiness.

The same workflow also runs the expanded route-level security suite:

```text
npm run test:security:expanded
```

That suite uses `scripts/security-route-manifest.mjs` as the executable route inventory for protected API routes, including expected owner access, anonymous denial, representative denied-role checks, scope expectations, audit expectations, and documented warnings.

## Smoke Test

Start the API and web app, then run:

```powershell
npm run smoke:test
```

The smoke test covers health, DB connectivity, login, anonymous rejection for a protected route, representative protected endpoints from each implemented module, AI disabled metadata, and the core web pages.

To run API-only checks:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke-test.ps1 -SkipWeb
```

The actual implemented OB ultrasound endpoint is `GET /ob-ultrasounds`; the actual implemented AI draft endpoint is `GET /ai-drafts`.

## Security Tests

After `npm run prisma:seed` and with the API/web apps running locally:

```powershell
npm run test:rbac
npm run test:scope
npm run test:audit
npm run test:ai-safety
npm run test:security
```

These are local demo safety checks for RBAC, branch scope, audit metadata, and disabled AI behavior. They are not production security certification tests and must not be run with real patient data.

For the CI-compatible API-only security integration runner, start the API after seeding and run:

```powershell
npm run test:security:ci
```

The runner uses `API_URL` when set, otherwise `http://localhost:3001`. It uses seeded demo credentials only and expects AI to remain disabled and draft-only.

Expanded route-level checks:

```powershell
npm run test:routes:auth
npm run test:scope:records
npm run test:audit:assertions
npm run test:ai:regression
npm run test:security:expanded
npm run test:admin:control
npm run test:theme:ui
npm run test:doctor:ux
npm run test:clinical:persistence
npm run test:visual:qa
```

Current hardening matrices:

- `docs/RBAC_MATRIX.md`
- `docs/ROLE_PERMISSION_MATRIX.md`
- `docs/REFERENCED_RECORD_SCOPE_MATRIX.md`
- `docs/RBAC_AUDIT_REVIEW.md`

See `docs/SECURITY_TESTING.md`.

## V0.1 Workflow Test

With the API running against seeded local data:

```powershell
npm run test:e2e:v01
```

This creates demo-only records for the V0.1 workflow and verifies representative audit metadata. It does not use real patient data, real clinical histories, real payment data, real report files, or external AI calls.

Clinical persistence and release-candidate UI sweeps:

```powershell
npm run test:clinical:persistence
npm run test:visual:qa
```

`test:clinical:persistence` verifies fake/demo patient-context appointment, queue, guided visit persistence, prescription, investigation, report, OB/GYN, invoice/payment, consent, timeline, audit, and signed-encounter edit protection.

`test:visual:qa` verifies release-candidate pages are reachable, normal UI avoids obvious technical text, patient file and doctor pages are present, and admin appearance controls remain protected.

Finance and general gynecology integration checks:

```powershell
npm run test:finance:reports
npm run test:gyn:starter
```

These use fake/demo data only. Finance remains manual with no real payment gateway, and gynecology remains recording-only with no automatic diagnosis, treatment recommendation, contraception recommendation, or prescribing.

Guideline Center checks:

```powershell
npm run test:guidelines
npm run test:integrated:probes
```

These use fake/demo text only. Do not upload real licensed guideline files. `GUIDELINE_VAULT_ENCRYPTION_KEY` must remain a local non-committed secret before any real private vault use.

## Local Backup

```powershell
npm run backup:local
```

Backups are written under ignored `backups/`. Restore is guarded and documented in `docs/BACKUP_RESTORE.md`; do not run restore unless explicitly intended for a local/dev database.

## VPS Staging Trial

VPS staging must use fake/demo data only. Do not enter real patient data or PHI.

Prepared VPS docs/scripts:

- `docs/VPS_STAGING_DEPLOYMENT_TRIAL.md`
- `scripts/bootstrap-vps-staging.sh`
- `scripts/deploy-staging.sh`

Remote staging smoke test:

```bash
STAGING_BASE_URL=https://staging.example.invalid \
STAGING_API_URL=https://staging-api.example.invalid \
STAGING_DEMO_OWNER_LOGIN=demo.owner@prij.local \
STAGING_DEMO_OWNER_PASSWORD='<staging-demo-password>' \
STAGING_DEMO_TEST_PASSWORD='<staging-demo-password>' \
npm run test:staging:smoke
```

Authenticated smoke checks use the local demo owner:

```powershell
$body = @{
  email = "owner@prij.local"
  password = "LocalDev123!"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3001/auth/login" `
  -ContentType "application/json" `
  -Body $body

$headers = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod "http://localhost:3001/auth/me" -Headers $headers
Invoke-RestMethod "http://localhost:3001/reports" -Headers $headers
Invoke-RestMethod "http://localhost:3001/pregnancies" -Headers $headers
Invoke-RestMethod "http://localhost:3001/ob-ultrasounds" -Headers $headers
Invoke-RestMethod "http://localhost:3001/billing/invoices" -Headers $headers
Invoke-RestMethod "http://localhost:3001/ai-drafts" -Headers $headers
```

## Prisma Workflow

Use the repository-root wrappers:

```powershell
npm run dev:stop
npm run prisma:migrate:local -- migration_name
npm run prisma:repair
npm run prisma:seed
```

Stop immediately if Prisma asks to reset the database or if a command would delete data or migrations.

## Status Documents

- `docs/CURRENT_STATUS.md`
- `docs/V0_1_RELEASE_NOTES.md`
- `docs/MVP_RC_VERIFICATION_CHECKLIST.md`
- `docs/PRODUCTION_READINESS_PLAN.md`
- `docs/API_ENDPOINTS.md`
- `docs/RBAC_MATRIX.md`
- `docs/RBAC_AUDIT_REVIEW.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/NEXT_STEPS.md`
- `docs/DOCTOR_FRIENDLY_UX.md`
- `docs/BACKUP_RESTORE.md`
- `docs/FILE_STORAGE_SECURITY.md`
- `docs/DEPLOYMENT_READINESS.md`
- `docs/ENVIRONMENT_STRATEGY.md`
- `docs/VPS_STAGING_DEPLOYMENT_TRIAL.md`
# Prij Clinic

Clinic Management System for OB/GYN and women’s health.

Current sprint status: v0.15.0 MVP Business Layer on Walkthrough Lock.

v0.15.0 builds on the locked v0.14.4 clinic demo walkthrough. The protected route `/clinic-day/walkthrough` remains the reference flow for reception, check-in, doctor waiting, patient profile, doctor visit, manual prescription draft, investigations, follow-up, and print packet discovery.

Business-layer scope:

- Visit-linked service selection from the Owner Service Catalog.
- Draft invoices, issue action, and reason-required void action.
- Manual payments only.
- Patient statement.
- Daily reports and role summary cards.
- Clinic settings polish.

Safety boundaries:

- No real patient data in code or seeds.
- No real payment gateway.
- No insurance/TPA.
- No full accounting ledger.
- No automatic diagnosis, prescribing, dosing, or treatment ranking.
- Clinical AI remains assistive and draft-only until reviewed and approved by a doctor.

Primary docs:

- `docs/V0_15_0_MVP_BUSINESS_LAYER_ON_WALKTHROUGH_LOCK.md`
- `docs/WALKTHROUGH_LOCK_CONTRACT.md`
- `docs/BILLING_WORKFLOW.md`
- `docs/MANUAL_PAYMENTS.md`
- `docs/PATIENT_STATEMENT.md`
- `docs/DAILY_REPORTS.md`
- `docs/CLINIC_SETTINGS.md`
# Prij Clinic v1.1.0

v1.1.0 adds the zero-paper clinic workflow foundation, bilingual `EN / عربي` UI switching, required Arabic visit type selection, pending work inbox, global smart search, paperless document/consent placeholders, and Guideline Library + Live Guideline Search foundation.

Arabic mode is RTL. `كشف`, `إعادة`, `استشارة`, and `مستعجل` stay Arabic in all languages. `مستعجل` means urgent examination / `كشف مستعجل`.

Guideline Library uses indexed local/allowed sources only. No paywall bypass, copyrighted guideline PDFs/text, or external AI is enabled by default. Evidence answers require citations and doctor review.

Do not use real patient data until signoff.
