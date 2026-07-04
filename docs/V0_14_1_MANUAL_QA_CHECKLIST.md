# v0.14.1 Manual QA Checklist

Sprint: v0.14.1 Mega Sprint QA Lock + Stabilization

Use synthetic local demo records only. Do not enter real patient data, real contact details, real clinical histories, PHI files, payment details, secrets, or production credentials.

## Safety Boundaries

- AI is doctor-assist and draft-only.
- No automatic diagnosis, prescribing, dosing, FGR diagnosis, anomaly interpretation, or fetal image AI.
- Medication safety content must remain source-review gated and doctor-reviewed.
- Clinical record changes must be audit-supported.
- Do not use WhatsApp, DICOM/PACS, insurance, mobile app, external AI runtime, real payment gateway, or full ledger flows for this QA lock.

## Startup

- [ ] `docker compose up -d postgres` starts PostgreSQL without deleting volumes.
- [ ] `npm run prisma:repair` completes.
- [ ] `npm run prisma:seed` completes using local/demo data only.
- [ ] `npm run dev` starts the API and web app.
- [ ] `http://localhost:3000/login` loads.

## Route Checklist

- [ ] `/login` loads and local demo login works.
- [ ] `/dashboard` loads after login.
- [ ] `/reception` loads.
- [ ] `/reception/today` shows daily reception workspace.
- [ ] `/reception/check-in` is reachable.
- [ ] `/calendar` loads.
- [ ] `/appointments` loads.
- [ ] `/queue` loads.
- [ ] `/doctor/waiting` loads.
- [ ] `/patients` loads.
- [ ] `/patients/new` creates a synthetic patient only.
- [ ] `/patients/[id]` opens the created synthetic patient workspace.
- [ ] Patient Doctor Visit tab is visible and opens.
- [ ] Patient Gynecology tab is visible and recording-only.
- [ ] Patient Pregnancy tab is visible.
- [ ] Patient Documents tab is visible.
- [ ] Patient Timeline tab is visible.
- [ ] Patient Billing tab is visible.
- [ ] `/admin` is protected from non-admin roles.
- [ ] `/admin/services` is Owner/Admin scoped.
- [ ] `/admin/settings` is Owner/Admin scoped.
- [ ] `/admin/medication-safety-profiles` is Owner/Admin scoped.

## Clinic Day Flow

- [ ] Create a synthetic patient from `/patients/new`.
- [ ] Schedule or confirm an appointment.
- [ ] Check in the patient from reception.
- [ ] Confirm the patient appears in queue.
- [ ] Confirm doctor waiting list shows the checked-in patient.
- [ ] Open the patient workspace.
- [ ] Start or resume Doctor Visit.
- [ ] Record history, encounter draft, investigation request, follow-up, and packet view without automatic clinical decisions.
- [ ] Open Gynecology and confirm templates are recording aids only.
- [ ] Open Pregnancy, fetus/multiple pregnancy starter, antenatal visit, and ultrasound report surfaces.
- [ ] Confirm documents/results timeline and patient timeline show workflow context without raw JSON/code text.
- [ ] Confirm service/invoice link remains billing-only and permission-aware.

## Wording Sweep

The visible UI must not show:

- [ ] Raw JSON, object dumps, stack traces, code-like keys, or developer placeholders.
- [ ] `safe in pregnancy`.
- [ ] `recommended drug`.
- [ ] `prescribe this`.
- [ ] `automatic diagnosis`.
- [ ] `automatic FGR`.
- [ ] Claims that the app replaces doctor review.

## Regression Checks

- [ ] RBAC denies receptionist/accountant access to advanced admin and medication safety review pages.
- [ ] Audit events remain present for clinical, billing, owner/admin, and review-gated actions where implemented.
- [ ] CORS remains exact-origin hardened.
- [ ] Image metadata stripping remains enabled for supported image upload paths.
- [ ] No fake patient, medication safety, or production-ready clinical claims are introduced.

## Cleanup

- [ ] Remove or close the synthetic patient workflow only through supported safe status actions.
- [ ] Do not reset, drop, or wipe the database.
- [ ] Stop dev servers with `npm run dev:stop`.
