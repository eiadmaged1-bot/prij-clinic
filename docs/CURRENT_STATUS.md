# Current Status

## Desktop UX reconstruction sprint

Branch: `fix/v1.4.2-doctor-core-merged-lock`.

Implemented:

- Responsive role shell with a fixed desktop sidebar, mobile drawer, compact account menu, safe session-expiry handling, and friendly patient-workspace failures.
- Unique Guideline action-card IDs and React keys.
- Shared restrained desktop design components and tokens, compact role dashboards, one queue workspace, role-filtered reports, calendar filters/tabs, and safer staff messaging states.
- Patient directory defaults to All patients and exposes advanced filters only on demand.
- Compact patient identity header with focused Overview, History, Current Visit, Prescriptions, Investigations & Results, Women’s Health, Documents, and Timeline tabs.
- Audited structured history tags and multi-term Smart Clinical Search.
- Seven-step doctor visit with draft persistence, validation, doctor review, signature, and audited amendment boundaries.
- Categorized investigation ordering, selected-request basket, custom favorite sets, and separate catalog administration.
- Doctor-owned medication shortcuts and prescription templates applied only as editable drafts.
- Signed, review-gated A5 prescription print route with English/Arabic support and navigation-free print CSS.
- Medication reference search/profile recovery plus Owner/Admin dry-run import, duplicate validation, provenance, review queue, and safe archive.
- HMAC-protected, replay-resistant, idempotent Google Form intake with pending review and no automatic patient merge.

Observed medication reference baseline during this sprint: 35 generic rows, 53 family rows, 1 medication product row, 15 market variants, 30 drug-market source rows, and 7 medication-data source rows. All 15 market variants are demo/reference fixtures; non-demo/official variants remain 0.

Safety status:

- No autonomous diagnosis, prescription, dosing, treatment ranking, or final clinical update.
- AI clinical content remains assistive and draft-only until doctor approval.
- Signed clinical records remain immutable except through audited amendment paths.
- Imported medication records default to `needs_review`.
- External intake remains pending and untrusted until an authorized reviewer acts; matching never auto-merges.
- No database reset/drop or migration deletion was performed.

The final local build/test matrix and 12-case multi-resolution desktop role QA pass. Public-tunnel QA is partial because the configured tunnel returns 404 for same-origin health; exact evidence and blocked checks are recorded in `docs/MANUAL_QA_REPORT.md`.
