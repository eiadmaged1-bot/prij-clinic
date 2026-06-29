# Next Steps

The exact next recommended sprint after this integration is:

## MVP Release Candidate Verification + Production-Readiness Planning

Goals:

- Complete one final full local verification pass across API, web, mobile/tablet layouts, visual QA, security tests, doctor workflow, patient workflow, OB/GYN workflow, and billing demo flow.
- Open the app manually at desktop, tablet, and phone widths using `docs/MOBILE_TABLET_QA.md`.
- Run the owner, reception, doctor, and release-candidate demo scripts end to end.
- Confirm patient-context actions remain operational after Codex A/B merge:
  - guided visit save
  - appointment
  - queue check-in
  - prescription
  - investigation order
  - report placeholder
  - ultrasound draft
  - invoice/payment
  - consent
  - timeline
- Confirm release-candidate UX remains readable and elder-friendly after backend persistence integration.
- Keep AI disabled, mock-only, draft-only, non-diagnostic, and doctor-review-only.
- Keep all data fake/local/demo-only.

## Production-Readiness Planning

Do not start real production deployment until the following are designed, implemented, tested, and reviewed:

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
