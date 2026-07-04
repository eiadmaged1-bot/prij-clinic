# Demo QA Checklist

## v0.12.7 Demo Candidate

- App starts locally with PostgreSQL.
- API health returns `ok`.
- API DB health returns `connected`.
- Login works with local demo credentials.
- Patient creation works with synthetic QA data only.
- Patient workspace opens after creation.
- Start Visit opens the doctor visit flow.
- Doctor visit flow shows History, Care Assist, Encounter, Prescription, Investigations, Follow-up, and Packet.
- Prescription workflow is generic-first.
- Dose, frequency, and duration are not auto-filled by default.
- Medication Safety Terminal is visible and review-gated.
- Medication safety source review/import page is usable for Owner/Admin.
- Receptionist/accountant cannot see advanced medication safety source review controls.
- Normal UI avoids raw JSON, code-like/developer wording, fake safety claims, safe-in-pregnancy wording, category E, and commerce/pharmacy inventory wording in clinical/reference contexts.
- Typecheck, build, and focused safety tests pass before tagging.

## Limitations

- Use fake/synthetic QA records only.
- Do not upload real reports, PDFs, spreadsheets, screenshots, raw imports, or PHI.
- Browser QA does not certify production readiness.
- AI remains assistive and draft-only.
- No autonomous diagnosis, prescribing, dosing, or treatment ranking is allowed.
