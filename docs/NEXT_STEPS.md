# Next Steps

The exact next recommended sprint after General Gynecology Starter is:

## General Gynecology Walkthrough Hardening

Goals:

- Rehearse the fake/demo patient flow from Doctor Mode into the patient-file Gynecology tab.
- Verify general gynecology visit creation, timeline event display, and browser print summary in the real demo browser.
- Tighten labels and empty states for the abnormal bleeding, pelvic pain, PCOS, fibroid or ovarian cyst, and contraception starter templates.
- Keep all templates recording-only and doctor-authored.
- Keep no automatic diagnosis, no diagnostic recommendations, no automatic treatment plan, no contraception recommendation engine, and no automatic prescribing.
- Run the full local verification suite, including `npm run test:gyn:starter`, `npm run test:obgyn:core`, `npm run test:accounts:rbac`, and visual QA.

## Pilot Demo Data + Browser Walkthrough Hardening

Goals:

- Prepare a clean fake/demo walkthrough dataset for owner, doctor, receptionist, and patient file flows.
- Add a script-assisted browser walkthrough for login, patient file, gynecology workspace, pregnancy workspace, antenatal visit, ultrasound report, timeline, print, theme switch, and non-admin account denial.
- Keep the current patient OB/GYN workspace as the pilot surface; avoid new large modules.
- Tighten labels, empty states, and print formatting discovered during real demo rehearsal.
- Keep all ultrasound, Doppler, fetal biometry, risk flags, and pregnancy history behavior recording-only.
- Keep all data fake/demo-only.
- Keep no automatic diagnosis, no FGR diagnosis, no fetal risk scoring, no fake percentile engine, no fetal-image AI, no real AI calls, and no PHI uploads.
- Run the full local verification suite, including `npm run test:obgyn:core`, `npm run test:accounts:rbac`, and visual QA.

## Then Home Server Dry Run Or VPS Trial

When infrastructure is ready:

- Use the prepared local/home-server runbooks or VPS staging scripts.
- Use fake/demo data only.
- Use staging-only secrets.
- Run `npm run prisma:migrate:deploy`, then explicit fake/demo seed.
- Verify `/health`, `/health/db`, login, admin denial, patient workflow, OB/GYN core depth, clinical persistence, visual QA, staging smoke, and backup procedure.
- Exercise rollback without dropping or resetting the database.
- Configure reverse proxy/TLS before broader review or any internet exposure.

## Then Account Security Deepening

Goals:

- Add MFA planning and implementation for Owner/Admin and doctor accounts.
- Add production password reset/change flow and force-change-after-temporary-password behavior.
- Add session/device inventory and server-side session revocation.
- Review production role design separately from demo presets.
- Keep `eyad` local/private demo only unless a separate production owner provisioning policy approves otherwise.

## Then Finance/Reports Hardening

Goals:

- Rehearse finance workflows with fake pilot data across Owner, Reception, and Accountant roles.
- Decide discount approval policy, refund approval policy, and whether dual approval is needed.
- Add production export controls only after access control, audit, and privacy review.
- Keep files metadata-only until secure PHI storage is implemented.
- Defer accounting ledger, taxes, e-invoicing, insurance/TPA, and payment gateway work.

## Then Safe AI Assistant

Goals:

- Keep AI disabled until a separate safety approval sprint.
- Add only draft-only, doctor-reviewed assistant behavior.
- Require consent, RBAC, audit, prompt-injection protection, provider/privacy review, and doctor approval before any external AI use.
- Prohibit AI diagnosis, prescribing, signing, final-record updates, RBAC bypass, consent bypass, and doctor-approval bypass.

## Production-Readiness Planning

The production-readiness plan is documented in `docs/PRODUCTION_READINESS_PLAN.md`. Do not start real production deployment until the following are designed, implemented, tested, and reviewed:

- Patient-to-doctor assignment or another explicit clinical access model.
- Production consent enforcement, legal text, signature/capture policy, and override workflow.
- Secure PHI file storage with encryption, access control, malware scanning, audit logging, expiring links, backup policy, and retention rules.
- Production-grade audit retention, tamper resistance, export review, and alerting.
- Backup encryption, restore proof, operational runbooks, monitoring, incident response, and disaster recovery.
- MFA, password reset, session/device inventory, and production security operations.
- Payment compliance design before any real payment gateway.
- Legal/privacy review before real patient use.
- Any future AI provider integration must have consent, RBAC, audit, privacy, provider contract, and doctor-review controls before use.
