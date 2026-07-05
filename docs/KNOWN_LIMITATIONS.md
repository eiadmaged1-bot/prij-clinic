# Known Limitations

v1.0.0 Pilot Release Candidate limitations:

- v1.0.0 is a Pilot Release Candidate, not a full production release.
- Real patient data remains blocked until legal, privacy, backup, and role-by-role signoff are complete.
- Manual role-by-role browser signoff is still required before real clinic use.
- External AI is disabled by default.
- AI remains assistive, draft-only, and doctor-approved.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, or AI final-record writing is implemented.
- No payment gateway, WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, or mobile app is included.
- Backup readiness is not a monitored production backup program; controlled restore drill and operational monitoring remain required.
- Browser/source checks do not replace legal, privacy, deployment, and operational review.

v0.18.1 staging browser QA lock limitations:

- v0.18.1 is a staging/browser QA lock only, not a production release.
- Automated browser-facing QA is source/static route coverage; it does not replace manual browser testing for every role.
- Real patient data remains blocked.
- External AI remains disabled by default.
- AI remains draft-only and doctor-reviewed.
- Production still requires legal/privacy review, deployment hardening, monitored backups, restore drills, secrets management, and role-by-role signoff.

v0.18.0 staging deployment package limitations:

- v0.18.0 is staging package only, not a production release.
- Real patient data remains blocked.
- External AI is disabled by default.
- AI remains draft-only and doctor-approved.
- `/ai-drafts` is the intentional implemented AI draft API route; `/ai/drafts` is not the current route.
- Doctor patient reads are branch-scoped because patient-to-doctor assignment is not modeled.
- Backup readiness is local/staging package readiness only; production still requires monitored encrypted backups and a restore drill.
- No payment gateway, WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, or mobile app is included.
- Production requires legal/privacy review, real backup/restore drill, HTTPS, monitoring, secrets management, role-by-role browser QA, and deployment hardening.

v0.17.1 Safe AI review lock limitations:

- v0.17.1 locks the Safe AI Assistant layer; it is not production AI.
- AI remains draft-only and requires doctor review/approval.
- External AI remains disabled by default.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, or final record writing is implemented.
- Seed idempotency is fixed for local/demo queue tickets, but seed data remains synthetic/demo-only.
- Future copy-to-record requires a separate audited, doctor-confirmed workflow.

v0.17.0 AI assistant limitations:

- v0.17.0 is not a production AI release.
- AI drafts are deterministic local drafts and still require doctor approval.
- External AI calls are disabled by default.
- Draft approval does not copy text into final clinical records.
- Patient-file search is patient-scoped and role-aware, but it is not semantic AI search.
- Missing-field checklist is completeness support only, not clinical advice.
- Follow-up reminder text is not sent automatically and contains no sensitive clinical detail by default.
- PHI/PII must not be sent externally unless explicit future governance is added.
- Prompt-injection protection treats external/user-provided content as untrusted, but future document/OCR pipelines need additional review before production use.

v0.16.1 deployment prep limitations:

- v0.16.1 is staging/deployment prep only, not a production release.
- Real patient data entry remains blocked until deployment, backup, legal/privacy, and role-by-role QA are complete.
- Backup scripts prove local readiness only; monitored production backups and a restore drill remain required.
- Restore is manual/admin-controlled only and is not run by readiness checks.
- External AI remains disabled unless explicitly configured later.
- AI remains doctor-assist and draft-only with no autonomous diagnosis, prescribing, dosing, or treatment ranking.
- No WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, real payment gateway, or mobile app is included.

v0.16.0 readiness limitations:

- v0.16.0 prepares for real patient data readiness, but it is not a full legal, compliance, security, or production-readiness certification.
- No real patient data is seeded or imported.
- No fake clinical data is added.
- Local backup readiness scripts are not a deployed production backup program.
- Consent tracking exists, but final legal text, clinic policy, and jurisdiction review remain required.
- AI remains doctor-assist and draft-only; it cannot diagnose, prescribe, dose, rank treatments, or write final clinical records autonomously.
- Medication safety population and reviewed source status remain governed separately.
- Role-by-role browser QA and deployment security stabilization remain required before real patient data.

- v0.14.4 walkthrough regression is static/source-level. Full browser visual QA and role-by-role workflow execution remain manual.
- `/clinic-day/walkthrough` points to module routes for patient-specific steps; the operator must open the synthetic patient profile after creation.
- Print packet route requires an existing patient id: `/patients/[id]/print/packet`.
- Clinical requests reuse existing investigation request tables internally for migration safety.
- Prescription builder patient attachment now uses the shared searchable PatientPicker; deeper browser E2E coverage is still needed.
- Appointment drawer patient selection still needs a full workflow pass if long-list selection is added there.
- Some patient action drawer fields still use text placeholders for doctor/room until provider and room setup is expanded.
- Local/demo account creation allows short passwords and short login IDs only outside production.
- Blank account email is stored with an internal non-login `@accounts.prij.local` compatibility value because the current User schema still requires a unique email.
- Official medicine source verification does not mean clinical safety verification.
- Live search ranking is local UI ordering over existing API results; it does not add clinical recommendations.
- Follow-up hints are read-only in this sprint.
- Manual QA is still required for role-by-role browser behavior.
- No external AI, WhatsApp, DICOM/PACS, payment gateway, pharmacy inventory, or automatic clinical decisioning is included.
# Known Limitations

v0.15.0 is still an MVP business layer on top of the locked demo walkthrough.

- Billing is clinic operations only, not a full accounting ledger.
- Payments are manual records only; there is no real payment gateway.
- Insurance/TPA workflows are not implemented.
- Patient statements are print-friendly views, not audited PHI exports.
- Clinic settings polish is mostly UI/documentation-level unless an existing audited setting already supports the change.
- Branch/room expansion remains intentionally limited.
- No real patient data should be seeded or imported.
- Clinical AI remains assistive and draft-only.
- The system does not automatically diagnose, prescribe, dose, or rank treatments.
