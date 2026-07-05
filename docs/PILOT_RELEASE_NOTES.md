# Pilot Release Notes

Release: v1.0.1 Pilot Signoff Lock

v1.0.1 locks the pilot usability scopes on top of the v1.0.0 Pilot Release Candidate. It is still not a full production release and must not be used with real patient data.

## v1.0.1 Additions

- Universal top-right account/logout menu remains available for all signed-in roles, including Receptionist.
- Tailscale local-dev mobile login support remains available through `npm run dev:tailscale` with dynamic localhost vs Tailscale host API resolution.
- Receptionist home is simplified to Waiting List, New Patient, and Returning Patient.
- Returning Patient lookup supports name, phone, patient ID, and MRN where available.
- Patient QR is available from each patient file.
- Patient QR contains patient ID only.
- Login and RBAC are still required to resolve QR or open patient files.
- Receptionist QR workflow can scan or manually enter patient ID, open the patient file, and check in/add to queue after confirmation.
- Phone camera scanning may require HTTPS; manual patient ID fallback is included.
- Tailscale support is local-dev only, not public production exposure. Firewall may need TCP `3000` and `3001` for private tailnet testing.

Safety boundaries remain unchanged: real patient data is blocked, external AI remains disabled by default, and AI remains draft-only until doctor review.

---

Release: v1.0.0 Pilot Release Candidate

This release candidate packages the current Prij Clinic pilot baseline for controlled staging review. It is not a full production release and must not be used with real patient data.

## Included Baseline

- Patient, appointment, queue, doctor calendar, patient profile, encounter, prescription, investigation, report, billing, payment, role, permission, audit, backup readiness, and security readiness foundations.
- Clinic walkthrough lock from v0.14.4.
- MVP business walkthrough from v0.15.0.
- Security and real patient data readiness gates from v0.16.0.
- Deployment prep lock from v0.16.1.
- Safe AI assistant layer and review lock from v0.17.0 and v0.17.1.
- Staging package and browser QA lock from v0.18.0 and v0.18.1.

## Not Included

- Real patient data approval.
- External AI enabled by default.
- Autonomous diagnosis, prescribing, dosing, or treatment ranking.
- Real payment gateway.
- WhatsApp.
- DICOM/PACS.
- Insurance/TPA.
- Full accounting ledger.
- Mobile app.

## Pilot Rules

Real clinic use remains blocked until legal/privacy review, backup/restore drill, deployment hardening, and manual role-by-role browser signoff are complete. AI remains assistive, draft-only, and doctor-approved.
