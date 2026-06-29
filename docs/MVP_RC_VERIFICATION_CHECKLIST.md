# MVP Release Candidate Verification Checklist

Date: 2026-06-29

This checklist verifies the local/private MVP release candidate as a controlled clinic demo. It is not production readiness approval and must not be used with real patient data, real PHI files, real payment details, or external AI providers.

## Pass/Fail Table

| Area | Verification | Status | Notes |
| --- | --- | --- | --- |
| Login | `eyad` / `eyad` signs in locally and `/auth/me` returns Owner/Admin context | Pass | Local demo credential only; forbidden outside private demo data |
| Non-admin access | Reception/non-admin users cannot access Admin or Appearance APIs | Pass | Covered by route authorization, admin control, theme UI, and visual QA checks |
| Owner flow | Dashboard, Owner Control Center, Appearance, service/pricing, safety and audit views open | Pass | Admin actions remain server-side protected and audited |
| Reception flow | Patient list, new patient file, patient open, appointment and queue actions from patient context work | Pass | Uses fake/demo records only |
| Doctor flow | Doctor Mode and Guided Visit open, save encounter draft steps, and return to patient file | Pass | No AI diagnosis or auto-prescribing |
| Patient file | Header, primary actions, tabs, patient-scoped records, and timeline load | Pass | Timeline is an MVP aggregation, not a legal medical chronology |
| OB/GYN | Pregnancy episode, fetus, antenatal visit, and ultrasound draft recording paths work | Pass | Recording-only; no FGR diagnosis, growth chart engine, or risk scoring |
| Orders/reports | Investigation order and report placeholder creation work from patient context | Pass | No PHI upload or real report files |
| Finance | Invoice and payment metadata can be created from patient context | Pass | No real payment gateway or card data |
| Admin overrides | Void/cancel/archive-style actions require owner/admin permission, reason, and audit | Pass | No normal audit-log deletion or silent signed-record hard delete |
| AI safety | AI remains disabled/mock-only, draft-only, and cannot update final clinical records | Pass | Covered by security integration and AI regression tests |
| UI wording | Normal UI avoids raw JSON, stack traces, endpoint labels, and technical implementation terms | Pass | Covered by visual QA sweep |
| Mobile/tablet | Release-candidate pages use responsive layouts acceptable for local demo QA | Pass | Not a production device/browser certification |
| Themes | Original Premium, Clinic Portal, Incision Portal, Minimal Clean, and Compact Operations remain usable | Pass | Theme switch is admin-protected when saved globally |

## Manual Demo Path

1. Start local services with `docker compose up -d postgres`, `npm run prisma:repair`, `npm run prisma:seed`, and `npm run dev`.
2. Open `http://localhost:3000/login`.
3. Sign in with local demo Owner credentials: ID `eyad`, password `eyad`.
4. Open Dashboard, Owner Control Center, Appearance, and Service Catalog.
5. Open Patients, create a fake demo patient file, and confirm the patient opens at `/patients/:id`.
6. From the patient file, create appointment, queue check-in, encounter/visit, prescription, investigation order, report placeholder, ultrasound draft, invoice/payment, and consent where permissions allow.
7. Open Doctor Mode and Guided Visit; save Complaint, History, Examination, Impression, Prescription/Orders step text where wired, Follow-up, and Finish Visit.
8. Confirm created records appear in the patient file and timeline.
9. Confirm OB/GYN recording paths are manual and non-diagnostic.
10. Confirm Admin and Appearance are hidden/denied for non-admin users.

## Known Demo Limits

- No real patient data or PHI files.
- No real AI provider and no diagnostic AI.
- No real payment gateway.
- No patient-to-doctor assignment model yet.
- Consent, audit retention, backup encryption, secure file storage, MFA, monitoring, and legal/privacy review remain production-readiness work.
