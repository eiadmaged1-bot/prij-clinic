# Known Limitations

This MVP foundation is not production-ready for real clinical operations. It is a local development foundation for review and hardening.

## Staging Prep Limitations

- Staging deployment files are examples and still need a real staging host, DNS/TLS setup, and secret provisioning.
- VPS staging is prepared but deferred; no VPS success tag should be created until a real server trial passes.
- Home-server operation is now documented as a local/LAN fake-data option, but it has not yet been run as a dedicated home-server dry run.
- Staging is fake/demo data only.
- Production patient use remains blocked until legal/security/privacy launch gates pass.
- Docker images and compose examples have been exercised locally through the local staging trial, but not yet on a real staging server.
- Production staff provisioning is not implemented; production seed intentionally does not create demo users.

## Release Candidate UX Limitations

- The current branch verifies the integrated MVP release candidate and adds production-readiness planning.
- `npm run test:visual:qa` is a lightweight page sweep. It checks status, layout markers, friendly wording, and protected appearance settings, but it is not a full screenshot comparison suite.
- Mobile/tablet QA is improved for demo acceptance, but production device certification, accessibility audit, and full browser matrix testing remain future work.
- Patient file tabs show patient-scoped related records where current APIs support it; deeper specialty screens and production charting workflows remain future work.

## Security And Privacy

- Branch, clinic, patient, and doctor scoping now cover representative read paths and referenced-record write paths for implemented MVP modules, but production-grade policy for every future state transition is still incomplete.
- Sensitive read audit coverage now exists for core sensitive MVP reads, but export/download and future timeline reads still need policy-specific coverage.
- MFA, password reset, session revocation, device/session inventory, and full throttling policy are not implemented.
- No automated production backup job is implemented yet.
- Local backup/restore helper scripts and a local staging backup helper exist, but production encrypted backup storage, off-site backup, and formal restore-test automation remain future work.
- No secure report file/object storage is implemented. Current report records store metadata/reference text only, and the file storage security plan remains documentation.
- Audit logs are application append-only, but database-level tamper resistance and retention controls are not implemented.

## RBAC

- Several controllers still use coarse MVP permissions where granular permission names do not exist yet, such as `pregnancy.manage` and `ob_ultrasound.manage`.
- Granular seeded permissions are now enforced for patients, appointments, queue status updates, encounters, prescriptions, investigations, and reports.
- Production role design needs explicit clinical, billing, admin, audit, and system-owner separation.
- UI navigation is not an authorization boundary; server-side guards are the source of truth.
- Patient-to-doctor assignment is not modeled, so doctor access is not yet limited to assigned patients outside doctor-owned records.

## Clinical Workflow

- Patient profile timeline is patient-focused and now aggregates available MVP records through a backend endpoint, but it is still not a production medical chronology, amendment ledger, or legal chart timeline.
- Doctor Mode and Guided Visit now persist structured encounter draft fields from the browser when opened from a patient file, but they are still a V0.1 demo workflow and not a complete specialty EHR note builder.
- Consent records now exist as a V0.1 foundation, but production legal text, signature capture, consent override workflow, and full server-side consent enforcement are not implemented.
- Signed encounter correction/versioning is not implemented.
- Prescription approval is represented by a sign action in the MVP foundation and needs final doctor-approval semantics before production use.
- Investigation result review and report review are foundational only.
- OB ultrasound records do not provide diagnostic automation and must not be interpreted as automated clinical decision support.
- OB/GYN core records now include pregnancy episode fields, fetus records, and antenatal visits, but no validated growth-chart engine, fetal risk scoring, or automated interpretation is implemented.

## Billing

- Invoice/payment flows are foundational only.
- Service catalog and price editing now exist for local demo configuration, but patient-context invoices currently use manually entered line items rather than a complete catalog picker.
- Refunds, invoice void reason workflow, discount approval workflow, and payment gateway integrations are not implemented.
- Payment records must remain metadata-only and must not store card numbers, CVV, payment tokens, or gateway secrets.

## Admin Control

- The `eyad` / `eyad` admin credential is local demo only and must not exist in staging or production.
- Admin override actions are V0.1 repair tools only. They require a reason and audit event, but do not replace a full production correction/retention policy.
- Audit logs cannot be deleted from the normal app UI, but database-level tamper resistance and retention enforcement remain future work.
- Signed clinical record hard-delete routes are not exposed in the normal UI/API; production-grade correction/versioning still needs more policy work.
- Appearance settings are admin-only and audited, but the V0.1 theme switcher is a demo UI foundation, not a full brand/design governance system.
- The saved default theme is stored in the database, while individual browser theme choices are stored locally for quick demo switching.
- The Clinic Portal theme is original Prij Clinic UI inspired by common clinic portal layout patterns; it does not implement future modules such as inventory, messaging, analytics, or support yet.

## AI

- AI is disabled and draft-only.
- No external AI API calls are allowed in the current foundation.
- AI draft placeholders are not clinical output and cannot update final clinical records.
- Any future AI integration requires separate consent, RBAC, audit, privacy, provider, and doctor-review design.

## Testing

- Current verification relies on typecheck, build, Prisma repair/seed, and smoke checks.
- Focused local security scripts now cover representative RBAC denial paths, branch scope behavior, referenced-record write denial paths, audit log creation, and AI draft safety. Exhaustive automated tests for every billing rollup edge case and future state transition are still needed.
- GitHub Actions has a database-backed API security integration workflow, including expanded route-security coverage, but it remains API-focused rather than full browser E2E production testing.
- CI security integration does not run the Next.js web app, browser smoke checks, or full route-by-route RBAC matrices.
- Expanded local Node tests now cover implemented protected API routes, representative denied-role cases, branch scope, referenced-record write denial paths, audit assertions, and AI safety regression. They still do not prove production-grade authorization for every future state transition.
- Admin control tests cover `eyad` login, service price updates, reason-required invoice void override, non-admin denial, audit entries, and absence of normal hard-delete routes for audit/clinical records.
- Theme UI tests cover required theme registry entries, local admin demo credentials on the login page, Clinic Portal and Incision Portal dashboard labels, non-admin denial for appearance settings, admin theme changes, and major page availability.
- Doctor UX tests cover the 3D icon registry, Doctor Mode labels, guided visit steps, simplified patient file tabs, comfort controls, non-admin admin denial, and major doctor-friendly page availability.
- Expanded tests use seeded owner access as the positive control. They do not yet prove every allowed lower-role path for every route and state transition.
- `npm run test:e2e:v01` covers a fake/demo happy path only. It does not prove clinical correctness, legal consent compliance, payment compliance, production security, or medical-device readiness.
- `npm run test:clinical:persistence` covers patient-context clinical persistence, OB/GYN core recording, patient timeline aggregation, patient finance basics, audit assertions, and signed encounter edit protection for fake/demo records only.

## Deployment

- V0.1 is local/private pilot software only.
- Local staging deployment has been proven with fake/demo data only.
- VPS staging deployment is prepared but deferred until a real server is available.
- Home-server deployment is a planned local/LAN option and still needs a dry run on actual hardware.
- Internet-exposed home-server use requires firewall review, HTTPS, DNS/DDNS or static IP planning, CGNAT review, backups, monitoring, and security hardening before any broader demo.
- Production deployment, staging hardening, secrets management, monitoring, HTTPS policy, MFA, secure file storage, backup encryption, restore proof, and legal/privacy review remain future work.
- The production-readiness plan exists in `docs/PRODUCTION_READINESS_PLAN.md`, but implementation of those gates is not complete.
