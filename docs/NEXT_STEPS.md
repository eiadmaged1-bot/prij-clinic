# Next Steps

The project is now following a local-first deployment path. VPS staging is prepared but deferred until a real server is available. Missing VPS access is no longer a blocker.

## Exact Next Sprint Options

Choose one:

1. **Home Server Dry Run**
   - Use an old PC or current PC as a LAN-only server with fake/demo data.
   - Follow `docs/LOCAL_SERVER_RUNBOOK.md`.
   - Verify Docker compose, migrations, explicit demo seed, health checks, staging smoke, and backup.
   - Do not expose the server to the internet until firewall, TLS, backup, and monitoring are reviewed.

2. **Real VPS Trial**
   - Use the prepared VPS scripts/docs when a server is available.
   - Run the deployment with fake/demo data only.
   - Configure staging-only secrets, migrate deploy, explicit demo seed, health checks, smoke tests, backup, and rollback.
   - Create a VPS success tag only after the real server trial passes.

3. **OB/GYN Depth Expansion**
   - If deployment remains deferred, improve pregnancy, antenatal visit, ultrasound recording, and clinician-authored reporting depth.
   - Do not add diagnostic fetal-image AI, automated FGR diagnosis, fake percentile engines, or real AI providers.

## Future VPS Staging Trial + TLS Hardening

Goals when a VPS is available:

- Run the prepared VPS deployment on a real server with fake/demo data only.
- Use `.env.staging.example` and `docker-compose.staging.yml` with staging-only secrets.
- Run `npm run prisma:migrate:deploy`, then staging demo seed.
- Verify `/health`, `/health/db`, login, admin denial, patient workflow, clinical persistence, visual QA, and backup procedure.
- Exercise rollback without dropping or resetting the database.
- Record issues before any pilot planning.
- Configure reverse proxy/TLS after direct-port health checks pass.

## Completed Current Sprint Scope

Local Staging Deployment Trial covers:

- Created and checked a local `.env.staging` workflow without committing secrets.
- Built API and Web staging Docker images locally.
- Ran local staging compose with isolated project `prij-clinic-staging`.
- Ran Prisma migrate deploy and explicit staging demo seed in the API container.
- Verified API/Web/Postgres health and local web reachability.
- Added and passed `npm run test:staging:smoke`.
- Added and verified `npm run backup:staging` for a non-destructive staging SQL backup.
- Documented restore as a checklist only; no destructive restore was run against the active local staging database.

## Previous Sprint Scope

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
