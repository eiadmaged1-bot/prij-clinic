# Current Status

v1.0.1 Pilot Signoff Lock is implemented on `stabilize/v1.0.1-pilot-signoff-lock`.

Completed in v1.0.1:
- Preserved the v1.0.0 Pilot Release Candidate baseline.
- Preserved universal top-right account/logout menu, receptionist logout access, display/login fallback, and role badge.
- Preserved Tailscale local-dev mobile login support, `npm run dev:tailscale`, dynamic API host logic, local-dev CORS, and no Tailscale Funnel/public exposure.
- Simplified `/reception` to Waiting List, New Patient, and Returning Patient.
- Added Returning Patient lookup by name, phone, patient ID, and MRN where available.
- Added Patient QR to patient files.
- Added `/reception/qr-scan` with camera scanning when supported and manual patient ID fallback.
- QR contains patient ID only, and resolving it still requires login and RBAC.
- Receptionist can check in/add to queue only after explicit confirmation.

Safety status:
- Real patient data remains blocked.
- External AI remains disabled by default.
- AI remains draft-only and doctor-reviewed.
- No WhatsApp, DICOM/PACS, insurance/TPA, payment gateway, full ledger, mobile app, external AI runtime call, autonomous diagnosis, autonomous prescribing, autonomous dosing, treatment ranking, or fake clinical claim was added.
- Actual phone camera QA remains manual; HTTPS may be required by mobile browsers.

UI Cleanup + Tailscale Mobile Access + Universal Logout is implemented on `fix/ui-cleanup-tailscale-mobile-login`.

Completed in this sprint:
- Shared top-right account menu with display/login fallback, role badge, profile info, and Logout for all signed-in roles, including receptionist.
- Tailscale tailnet-only local dev mode with `npm run dev:tailscale`, dynamic browser API host resolution, local-dev Tailscale CORS, and `scripts/print-tailscale-dev-url.ps1`.
- Compact UI cleanup for shared pages, patient files, new patient intake, check-in, and appointment list labeling.
- Training/demo records are hidden by default on patient/check-in flows with explicit “Show training records” controls.
- Sensitive intake remains optional and collapsed, defaulting to “Unknown / not asked.”

Safety status:
- No real patient data, public exposure, Tailscale Funnel, external AI calls, real payment gateway, auth weakening, RBAC weakening, audit weakening, or AI safety weakening was added.
- Staging/production CORS remains exact HTTPS origin oriented; Tailscale dynamic access is local/dev only.

v1.0.0 Pilot Release Candidate is in progress on `release/v1.0.0-pilot-rc`.

Scope:
- Release packaging, final verification, documentation, and tagging only.
- Preserve the clinic walkthrough lock, MVP business layer, security/readiness gates, staging package, browser QA lock, and safe AI assistant draft-only behavior.
- Do not add product features, architecture rewrites, or new clinical logic.

Safety status:
- v1.0.0 is a Pilot Release Candidate, not a full production release.
- Real patient data remains blocked until legal/privacy, backup/restore, deployment, and role-by-role signoff are complete.
- External AI is disabled by default.
- AI remains draft-only and doctor-approved.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, fake clinical claims, real payment gateway, WhatsApp, DICOM/PACS, insurance/TPA, full ledger, or mobile app is included.
- Manual role-by-role browser signoff is still required before real clinic use.

v0.18.1 Staging Browser QA Lock is in progress on `stabilize/v0.18.1-staging-browser-qa-lock`.

Scope:
- Browser-facing staging QA lock for v0.18.0 routes, role-by-role browser checklist documentation, final staging stabilization, and release tagging if final checks pass.

Safety status:
- No new product features are added.
- Real patient data remains blocked.
- External AI remains disabled by default.
- AI remains draft-only and doctor-approved.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, external integrations, fake clinical claims, or real payment gateway are added.

v0.18.0 Staging Deployment Package is in progress on `feature/v0.18.0-staging-deployment-package`.

Scope:
- Staging Docker/deployment package, environment examples, local production simulation, staging smoke tests, health checks, migration deploy verification, backup readiness, upload/storage path readiness, seed safety, security header/CORS/env validation checks, deployment docs, and regressions.

Safety status:
- v0.18.0 is staging package only, not a production release.
- Real patient data remains blocked.
- External AI is disabled by default.
- AI remains draft-only and doctor-approved.
- No payment gateway, WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, mobile app, external AI runtime calls, autonomous diagnosis, autonomous prescribing, autonomous dosing, treatment ranking, or fake clinical claims are added.
- Production requires legal/privacy review, real backup/restore drill, HTTPS, monitoring, secrets management, role-by-role browser QA, and deployment hardening.

v0.17.1 Safe AI Review Lock is implemented on `stabilize/v0.17.1-safe-ai-review-lock`.

Completed in v0.17.1:
- Seed idempotency is fixed for local/demo queue tickets without resetting, dropping, or deleting queue data.
- The v0.17.0 Safe AI Assistant layer is locked intact.
- AI assistant checks confirm drafts require doctor approval.
- External AI remains disabled by default.
- Receptionist/accountant and other lower-role clinical AI access remains blocked by RBAC.
- Prompt-injection guard checks still pass.
- Final regression checks passed before tagging.

Safety status:
- AI is draft-only and doctor-assist only.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, or final record writing is added.
- v0.17.1 is not production AI.
- Future copy-to-record requires a separate audited, doctor-confirmed workflow.

v0.17.0 Safe AI Assistant Layer is implemented on `feature/v0.17.0-safe-ai-assistant-layer`.

Completed in v0.17.0:
- `/ai-assistant` shell and patient-file assistant panel.
- Deterministic patient history summary draft.
- Deterministic visit note summary draft.
- Missing-field checklist.
- Follow-up reminder draft with no sending integration.
- Patient-scoped file search helper.
- Doctor approval/rejection workflow on AI draft artifacts.
- AI audit events and prompt-injection warning checks.
- v0.17 source-level regression scripts.

Safety status:
- AI is assistive only.
- AI drafts require doctor approval.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, or final clinical decision is added.
- External AI calls are disabled by default.
- PHI/PII must not be sent externally unless explicit future governance is added.
- v0.17.0 is not a production AI release.

v0.16.1 Security Deployment Prep Lock is in progress on the stabilization branch.

v0.16.1 is staging/deployment prep, not a production release. It locks the v0.14.4 clinic walkthrough, v0.15.0 MVP business layer, and v0.16.0 security/readiness gates while adding local startup, deployment prep, backup/restore runbook, role-by-role source readiness, and combined regression checks.

Safety status:
- Real patient data entry is still blocked until deployment, backup, legal/privacy, and role-by-role QA are complete.
- External AI remains disabled unless explicitly configured in a later reviewed sprint.
- AI remains doctor-assist and draft-only.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, or fake clinical claims are added.
- No WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, real payment gateway, or mobile app is included.

v0.16.0 Security + Real Patient Data Readiness is complete on the feature branch.

Completed in v0.16.0:
- API security headers are wired.
- Strict production/staging environment validation is tightened.
- Audit metadata redaction and bounding are present.
- Investigation cancel/void transitions require a reason.
- `/admin/security-readiness` is Owner/Admin protected and backed by an audited API endpoint.
- RBAC, audit governance, backup readiness, PHI/document safety, production readiness, AI safety, and combined v0.16 regression gates are registered.
- Documentation now covers security readiness, role permissions, audit governance, real patient data readiness, backup readiness, PHI/PII document safety, production readiness, AI safety, current status, next steps, and known limitations.

Safety status:
- v0.16.0 prepares for real patient data readiness, but does not claim full legal or production readiness.
- No real patient data is seeded.
- No fake clinical data is added.
- AI remains doctor-assist and draft-only.
- No automatic diagnosis, prescribing, dosing, FGR diagnosis, or treatment ranking is added.
- Reviewed medication safety population remains governed separately.
- Next sprint is security stabilization + deployment prep.

v0.14.4 clinic demo walkthrough lock is implemented on the local demo branch.

Completed in v0.14.4:
- Added `/clinic-day/walkthrough` as the guided local clinic day path.
- Added walkthrough launchers from Dashboard, Owner Control Center, Reception Today, and Doctor Workspace.
- Locked the static regression checks for New Patient to profile, PatientPicker check-in, compact doctor waiting, doctor visit complaint/autosave, prescription draft, investigation chips, follow-up, and print packet source.
- Doctor Waiting now exposes compact current-patient markup with Open file, Continue visit, and Complete actions.

Verification added:
- `npm run test:v144:clinic-walkthrough`

v0.14.3.1 post-visual hotfix is in verification on the local demo branch.

Completed in v0.14.3:
- New Patient hides sex/gender from reception and defaults sex internally to female for the OB/GYN workflow.
- Sexual activity status is optional under Sensitive clinical details.
- Sidebar collapse/drawer behavior, density lock classes, compact calendar/reception/check-in, patient action drawers, patient summary, doctor current patient card, collapsed workflow help, Protocol Atlas, AI Drafts, medication live search, official medicine wording, and account creation/demo visibility were repaired.
- Demo/training records are hidden by default on key patient/reception/calendar/account surfaces.

Completed in this sprint:
- Premium patient universe, reception today desk, date search, context-aware forms, smart search shortcuts, complaint cards, autosave draft foundation, offline sync queue, autosave sync health, and owner control center upgrade.
- Doctor Comfort Mode with local persistence, doctor/owner top-bar toggle, owner-managed appearance default, larger controls, simplified patient workspace tabs, and calmer doctor visit surfaces.
- Premium 3D UI polish for reusable medical icons, cards, and action surfaces.
- Smart empty states with safe local next actions.
- Human-readable audit and record labels.
- Compact demo and safety badges that keep AI draft-only and doctor-review boundaries visible.

Completed in v0.14.3.1:
- Comfort Mode topbar utility buttons stay compact and nowrap.
- Reception New Patient hides patient type while keeping internal compatibility defaults.
- Account creation supports blank email with internal non-login compatibility email and friendly errors.
- Demo/test accounts and guideline training documents are hidden by default with toggles.
- Audit read/view events are hidden by default in Owner Control.
- Clinical request selections are compact chips.
- Prescriptions, investigations, and check-in use a searchable PatientPicker.
- Protocol Atlas opens in compact list view by default.
- Reception Today no longer duplicates patient search sections.

Safety status:
- Local demo/training data only. Do not enter real patient data.
- AI remains disabled or draft-only support. It cannot diagnose, prescribe, sign, or silently update final records.
- Clinical record changes remain RBAC-protected and audit-log oriented.
- No WhatsApp, DICOM/PACS, external AI, or real payment gateway integration is enabled.
# Current Status - v0.15.0 MVP Business Layer

v0.15.0 builds on the locked v0.14.4 clinic demo walkthrough. `/clinic-day/walkthrough` remains protected and discoverable.

Implemented in this sprint:

- Visit-linked billing context for appointments, queue tickets, and encounters.
- Owner Service Catalog selection for billing-only services.
- Draft invoice workflow with issue and reason-required void actions.
- Manual payment recording for cash, card, transfer, and other methods.
- Patient statement source and billing tab summaries.
- Daily reports with appointments, check-ins, completed visits, issued invoices, payments collected, outstanding balances, investigations, pending results, and follow-ups due.
- Owner, reception, and doctor summary cards.
- Clinic settings polish for profile and billing-default concepts.
- `test:v150:mvp-business-walkthrough` regression coverage.

Safety status:

- No real patient data is seeded.
- No real payment gateway is integrated.
- No insurance/TPA or full accounting ledger is included.
- No automatic diagnosis, prescribing, dosing, or treatment ranking is added.
- Clinical AI remains assistive and draft-only.

Next sprint should be Security + Real Patient Data Readiness.
# v1.1.0 Current Status

v1.1.0 improves zero-paper workflow and bilingual UI. The shared shell has a top-right `EN / عربي` language switcher; Arabic mode is RTL. `كشف`, `إعادة`, `استشارة`, and `مستعجل` stay Arabic in all languages, and `مستعجل` means urgent examination / `كشف مستعجل`.

Guideline Library stores, browses, and searches only indexed local/allowed sources. There is no paywall bypass, no copyrighted guideline PDF/text committed, no external AI enabled by default, and evidence answers require citations with doctor review.

Real patient data remains blocked until signoff.
