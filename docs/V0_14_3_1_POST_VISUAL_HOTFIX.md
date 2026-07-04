# v0.14.3.1 Post-Visual Hotfix

Focused hotfix for manual QA issues after v0.14.3. This is local/demo workflow repair only.

Completed:
- Doctor Comfort Mode no longer enlarges topbar utility controls; topbar labels stay nowrap and compact.
- New Patient hides patient type from reception and defaults the internal workflow to women health compatibility.
- Account creation keeps email optional by using the existing internal non-login compatibility email when blank and showing "No email saved" in UI.
- Demo/test accounts are hidden by default in Accounts and Owner Control, with toggles to reveal them.
- Owner audit viewer hides read/view events by default and maps read events to human labels when shown.
- Clinical Request selected investigations render as compact removable chips.
- Prescriptions, investigations, and check-in use the shared searchable PatientPicker instead of long native patient dropdowns.
- Guideline Center and Review Queue hide demo/training route guideline documents by default.
- Protocol Atlas defaults to compact list and protects the "Verified snapshot" badge from word splitting.
- Reception Today search is merged into Find today's patient and the duplicate patient search section was removed.

Safety unchanged:
- No real patient seed data.
- No external AI, WhatsApp, DICOM/PACS, or payment gateway.
- AI and Care Assist remain draft-only and doctor-review-only.
- Medication reference metadata remains non-prescriptive.
- RBAC, protected Eyad owner behavior, audit storage, and signed-record safety were not weakened.

Verification:
- Targeted source regression: `npm run test:v1431:post-visual-hotfix`.
- Standard verification remains `npm run prisma:repair`, `npm run prisma:seed`, `npm run typecheck`, and `npm run build`.
