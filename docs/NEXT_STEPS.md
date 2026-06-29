# Next Steps

The exact next recommended sprint after the OB/GYN backend depth branch is:

## OB/GYN UX Integration + VPS Staging Re-Verification

Goals:

- Wire frontend OB/GYN forms to the new previous pregnancy, fetus, antenatal visit, and ultrasound recording APIs.
- Re-run staging migrations and fake/demo seed after merging backend and frontend OB/GYN branches.
- Verify `/health`, `/health/db`, login, admin denial, patient workflow, OB/GYN core depth, clinical persistence, visual QA, and backup procedure.
- Keep all ultrasound, Doppler, risk flag, and pregnancy history behavior recording-only.
- Continue VPS staging/TLS work with fake/demo data only after merge.

## Completed Current Sprint Scope

OB/GYN Core Depth Backend covers:

- Pregnancy episode depth with recording-only risk flags and active/inactive/ended-style status support.
- Previous pregnancy history create/list APIs.
- Fetus and multiple pregnancy create/list/update APIs.
- Deeper antenatal visit recording fields.
- Deeper OB ultrasound recording fields linked to patient, pregnancy, fetus, and encounter.
- Patient timeline integration for OB/GYN depth events.
- Dedicated `npm run test:obgyn:core` API workflow test.

## Previous Sprint Scope

Local Staging Deployment Trial covers:

- Created and checked a local `.env.staging` workflow without committing secrets.
- Built API and Web staging Docker images locally.
- Ran local staging compose with isolated project `prij-clinic-staging`.
- Ran Prisma migrate deploy and explicit staging demo seed in the API container.
- Verified API/Web/Postgres health and local web reachability.
- Added and passed `npm run test:staging:smoke`.
- Added and verified `npm run backup:staging` for a non-destructive staging SQL backup.
- Documented restore as a checklist only; no destructive restore was run against the active local staging database.

## Production Hardening Scope

Production Hardening + Staging Deployment Prep covers:

Goals:

- Use `docs/MVP_RC_VERIFICATION_CHECKLIST.md` as the verified local-demo baseline.
- Implement staging deployment prep without using real patient data.
- Remove or disable all local demo credentials outside local/private demo seeds.
- Harden secrets handling, environment validation, HTTPS configuration, backup encryption, restore proof, and incident-response runbooks.
- Prepare staging smoke/security verification using `npm run prisma:migrate:deploy`, not reset/drop commands.
- Review role-by-role workflows with clinic stakeholders using fake data only.
- Keep AI disabled, mock-only, draft-only, non-diagnostic, and doctor-review-only.
- Keep all data fake/local/demo-only.

## Production-Readiness Planning

The initial production-readiness plan is documented in `docs/PRODUCTION_READINESS_PLAN.md`. Do not start real production deployment until the following are designed, implemented, tested, and reviewed:

- Patient-to-doctor assignment or another explicit clinical access model.
- Production consent enforcement, legal text, signature/capture policy, and override workflow.
- Secure PHI file storage with encryption, access control, malware scanning, audit logging, expiring links, backup policy, and retention rules.
- Production-grade audit retention, tamper resistance, export review, and alerting.
- Backup encryption, restore proof, operational runbooks, monitoring, incident response, and disaster recovery.
- MFA, password reset, session/device inventory, and production security operations.
- Payment compliance design before any real payment gateway.
- Legal/privacy review before real patient use.
- Any future AI provider integration must have consent, RBAC, audit, privacy, provider contract, and doctor-review controls before use.

## UX Follow-Up

- Improve the visual ergonomics of the new patient-context action forms.
- Add a real patient search dropdown in the top bar that opens patient files without exposing internal IDs.
- Add role-specific home routing so Doctor users land directly in Doctor Mode and Reception users land on the front-desk flow.
- Add screenshot-based visual regression only after the release-candidate layout stabilizes.

## OB/GYN Follow-Up

- Build better screens for pregnancy fetus records and antenatal visits.
- Add validated gestational-age display only after clinical rules are reviewed.
- Keep ultrasound as recording-only until clinician-reviewed interpretation workflows are stronger.
- Do not add automated FGR diagnosis, fetal risk scoring, fetal-image AI, or fake percentile engines.
