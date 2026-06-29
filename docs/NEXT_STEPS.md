# Next Steps

The exact next recommended sprint after this release-candidate verification is:

## Production Hardening + Staging Deployment Prep

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
