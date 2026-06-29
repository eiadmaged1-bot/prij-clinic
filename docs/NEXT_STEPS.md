# Next Steps

The exact next recommended sprint after the doctor-friendly UX reset is:

## MVP Release Candidate Polish + OB/GYN Depth Expansion

Goals:

- Convert the guided visit UI from a front-end workflow shell into patient-context forms that create encounter, prescription, order, report, and billing records directly from the patient file.
- Add OB/GYN depth for pregnancy episodes, antenatal visits, ultrasound draft recording, and clinician-only interpretation workflow.
- Keep Doctor Mode simple for older doctors while preserving Owner Control Center power for owners/admins.
- Add patient-file-native action forms so users no longer copy patient references between module pages.
- Keep all actions server-authorized, scope-checked, and audit logged.
- Keep all demo data fake/local only.
- Keep AI disabled, draft-only, non-diagnostic, and doctor-review-only.

## UX Polish Follow-Up

- Add browser screenshots for all five themes after the layout stabilizes.
- Add mobile/tablet checks for Doctor Mode and patient file tabs.
- Add a real patient search dropdown in the top bar that opens patient files without exposing internal IDs.
- Add role-specific home routing so Doctor users land directly in Doctor Mode and Reception users land on front desk flow.

## Admin Hardening Follow-Up

- Add role-by-role manual QA for the Admin Control Center.
- Add browser-level checks for login, admin service price edit, patient creation, and patient file open.
- Add visual regression screenshots for all themes across desktop and mobile.
- Decide whether the saved default theme should apply before login or only after staff sign-in.
- Add production policy design for admin correction workflows, retention, and audit tamper resistance.

## Security And Production-Readiness Hardening

- Add patient-to-doctor assignment or an explicit access model for doctor patient reads.
- Add exhaustive lower-role positive-path matrices for every route and state transition.
- Add production-grade audit retention, tamper-resistance, export review, and alerting controls.
- Add production consent enforcement design before enforcing real consent rules.
- Add secure PHI file storage implementation with encryption, access control, malware scanning, audit logging, and expiring links.
- Add production backup encryption, restore proof, runbooks, monitoring, MFA, and legal/privacy review.
- Keep AI disabled and draft-only until consent, provider privacy, RBAC, audit, and doctor-review controls are complete.

Do not start production deployment until patient assignment/access policy, consent enforcement, audit retention/tamper-resistance, backup/restore proof, monitoring, MFA, legal review, and secure PHI file storage are stronger.
