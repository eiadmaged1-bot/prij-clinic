# Current Status

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
