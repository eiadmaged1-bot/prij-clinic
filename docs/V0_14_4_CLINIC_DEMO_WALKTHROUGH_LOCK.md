# v0.14.4 Clinic Demo Walkthrough Lock

This sprint locks one local training path so the clinic demo feels like a connected daily workflow:

```text
Owner login
-> create receptionist account
-> create patient
-> check-in / walk-in
-> doctor waiting
-> open patient profile
-> start doctor visit
-> select complaint card
-> save visit draft
-> create prescription draft
-> request investigation
-> add follow-up
-> print patient packet
```

Walkthrough route:

```text
/clinic-day/walkthrough
```

Locked surfaces:
- Dashboard, Owner Control Center, Reception Today, and Doctor Workspace link to the walkthrough.
- New Patient hides sex and patient type fields, keeps safe OB/GYN internal defaults, and opens the patient profile after save.
- Check-in uses the shared searchable PatientPicker and compact walk-in wizard.
- Doctor Waiting uses compact handoff cards with Open file, Continue visit, and Complete actions.
- Patient profile action drawers keep the current patient selected and avoid asking for Patient ID.
- Doctor Visit keeps complaint cards, autosave label, Save Draft, and step navigation.
- Prescription drafts use PatientPicker and manual doctor-entered patient instructions.
- Investigation requests use PatientPicker, live catalog search, and compact selected request chips.
- Follow-up and packet printing are discoverable from the patient profile and doctor visit flow.

Regression command:

```powershell
npm run test:v144:clinic-walkthrough
```

Safety boundaries:
- Local demo/training only. Do not use real patient data.
- No external AI calls, WhatsApp, DICOM/PACS, real payment gateway, insurance, or production readiness claim.
- AI and Care Assist remain draft-only and doctor-review-only.
- AI cannot diagnose, prescribe, sign, or update final records.
- Medication strength and form remain reference metadata only, never patient dosing instructions.
- Signed clinical records cannot be silently changed by autosave.

Manual QA remaining:
- Full browser visual QA across roles and mobile widths.
- Dynamic end-to-end account creation through printed packet with a seeded local database.
- Role-by-role confirmation that launcher visibility remains understandable for clinic staff.
