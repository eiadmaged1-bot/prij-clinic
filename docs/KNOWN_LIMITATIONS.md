# Known Limitations

This MVP foundation is not production-ready for real clinical operations. It is a local development and demo foundation for review, hardening, and fake-data workflow validation.

## Staging And Deployment

- Staging deployment files are examples and still need a real staging host, DNS/TLS setup, and secret provisioning.
- Staging is fake/demo data only.
- Production patient use remains blocked until legal/security/privacy launch gates pass.
- Docker images and compose examples have been exercised locally through the local staging trial, but not yet on a real staging server.
- Production staff provisioning is not implemented; production seed intentionally does not create demo users.
- VPS staging deployment, production deployment, staging hardening, secrets management, monitoring, HTTPS policy, MFA, secure file storage, backup encryption, restore proof, and legal/privacy review remain future work.

## OB/GYN v0.2 Remaining Limitations

- OB/GYN v0.2 is a specialty recording and workflow foundation, not automated clinical decision support.
- No automatic diagnosis is implemented.
- No automatic FGR diagnosis is implemented.
- No fetal risk scoring is implemented.
- No fake percentile engine is implemented.
- No validated growth charts are implemented.
- No DICOM/PACS workflow is implemented.
- No real PHI imaging upload is implemented.
- No fetal-image AI is implemented.
- Clinician interpretation is required for ultrasound, Doppler notes, fetal biometry, pregnancy risk notes, and report impressions.
- Browser print styles are intended for demo review and are not legal medical stationery, prescription paper, or production report output.

## Release Candidate UX Limitations

- `npm run test:visual:qa` is a lightweight page sweep. It checks status, layout markers, friendly wording, and protected appearance settings, but it is not a full screenshot comparison suite.
- Mobile/tablet QA is improved for demo acceptance, but production device certification, accessibility audit, and full browser matrix testing remain future work.
- Patient file tabs show patient-scoped related records where current APIs support it; deeper specialty screens and production charting workflows remain future work.
- OB/GYN patient workspace UX is now connected to the v0.2 backend for pregnancy episode, previous pregnancy history, fetus records, antenatal visits, ultrasound drafts, and timeline summaries. It remains a demo workflow and is not a complete production specialty EHR.

## Security And Privacy

- Branch, clinic, patient, and doctor scoping cover representative read paths and referenced-record write paths for implemented MVP modules, but production-grade policy for every future state transition is still incomplete.
- Sensitive read audit coverage exists for core sensitive MVP reads, but export/download and future timeline reads still need policy-specific coverage.
- MFA, password reset, session revocation, device/session inventory, and full throttling policy are not implemented.
- Account management now supports local/demo account creation, presets, toggles, and protected `eyad` metadata, but production-grade onboarding, invitation, force password change, MFA, and session inventory remain future work.
- No automated production backup job is implemented yet.
- Local backup/restore helper scripts and a local staging backup helper exist, but production encrypted backup storage, off-site backup, and formal restore-test automation remain future work.
- No secure report file/object storage is implemented. Current report records store metadata/reference text only, and the file storage security plan remains documentation.
- Audit logs are application append-only, but database-level tamper resistance and retention controls are not implemented.

## RBAC

- Several controllers still use coarse MVP permissions where granular permission names do not exist yet, such as `pregnancy.manage` and `ob_ultrasound.manage`.
- Granular seeded permissions are enforced for patients, appointments, queue status updates, encounters, prescriptions, investigations, and reports.
- Production role design needs explicit clinical, billing, admin, audit, and system-owner separation.
- UI navigation is not an authorization boundary; server-side guards are the source of truth.
- Patient-to-doctor assignment is not modeled, so doctor access is not yet limited to assigned patients outside doctor-owned records.

## Clinical Workflow

- Patient profile timeline is patient-focused and aggregates available MVP records, but it is still not a production medical chronology, amendment ledger, or legal chart timeline.
- Doctor Mode and Guided Visit persist structured encounter draft fields from the browser when opened from a patient file, but they are still a V0.1/V0.2 demo workflow and not a complete specialty EHR note builder.
- Consent records exist as a foundation, but production legal text, signature capture, consent override workflow, and full server-side consent enforcement are not implemented.
- Signed encounter correction/versioning is not implemented.
- Prescription approval is represented by a sign action in the MVP foundation and needs final doctor-approval semantics before production use.
- Investigation result review and report review are foundational only.
- OB ultrasound records support raw recording fields for scan type, indication, fetus link, biometry, EFW, Doppler note, and doctor-written impression, but they do not provide diagnostic automation.
- OB/GYN records include previous pregnancy history, fetus/multiple pregnancy records, deeper antenatal visits, and pregnancy timeline events, but remain recording-only.

## Billing

- Invoice/payment flows are foundational only.
- Service catalog and price editing exist for local demo configuration, but patient-context invoices currently use manually entered line items rather than a complete catalog picker.
- Refunds, invoice void reason workflow, discount approval workflow, and payment gateway integrations are not implemented.
- Payment records must remain metadata-only and must not store card numbers, CVV, payment tokens, or gateway secrets.

## Admin Control

- The `eyad` / `eyad` admin credential is local demo only and must not exist in staging or production.
- `eyad` is protected as the only local demo System Owner. Normal UI/API flows block deactivation, demotion, and reserved permission removal, but production owner provisioning still needs a separate policy.
- Admin override actions are V0.1 repair tools only. They require a reason and audit event, but do not replace a full production correction/retention policy.
- Audit logs cannot be deleted from the normal app UI, but database-level tamper resistance and retention enforcement remain future work.
- Signed clinical record hard-delete routes are not exposed in the normal UI/API; production-grade correction/versioning still needs more policy work.
- Appearance settings are admin-only and audited, but the V0.1 theme switcher is a demo UI foundation, not a full brand/design governance system.

## AI

- AI is disabled and draft-only.
- No external AI API calls are allowed in the current foundation.
- AI draft placeholders are not clinical output and cannot update final clinical records.
- Any future AI integration requires separate consent, RBAC, audit, privacy, provider, and doctor-review design.

## Testing

- Current verification relies on typecheck, build, Prisma repair/seed, and smoke checks.
- Focused local security scripts cover representative RBAC denial paths, branch scope behavior, referenced-record write denial paths, audit log creation, and AI draft safety.
- GitHub Actions has a database-backed API security integration workflow, including expanded route-security coverage, but it remains API-focused rather than full browser E2E production testing.
- Expanded tests use seeded owner access as the positive control. They do not yet prove every allowed lower-role path for every route and state transition.
- `npm run test:e2e:v01` covers a fake/demo happy path only. It does not prove clinical correctness, legal consent compliance, payment compliance, production security, or medical-device readiness.
- `npm run test:clinical:persistence` covers patient-context clinical persistence, OB/GYN core recording, patient timeline aggregation, patient finance basics, audit assertions, and signed encounter edit protection for fake/demo records only.
- `npm run test:obgyn:core` covers pregnancy episode depth, previous pregnancy history, fetus/multiple pregnancy records, antenatal visit depth, OB ultrasound recording fields, timeline entries, audit entries, unauthorized-role denial, and no diagnostic ultrasound behavior for fake/demo records only.
- `npm run test:obgyn:workflow` covers the verified doctor workflow after accounts/session hardening: fake patient creation, pregnancy episode, previous pregnancy history, fetus record, antenatal visit, ultrasound draft, timeline entries, session shell cues, login already-signed-in source state, accounts shortcut visibility source state, and non-admin `/admin/accounts` denial.
