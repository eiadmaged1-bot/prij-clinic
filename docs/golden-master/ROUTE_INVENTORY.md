# Golden Master Route Inventory

## Status legend

- `VERIFIED`: route is directly confirmed in the frozen source registry or page source.
- `PARTIAL`: route is known but still needs rendered desktop/mobile verification.
- `DYNAMIC`: route requires a real identifier and workflow context.
- `PRINT`: route requires print-layout validation.
- `INTERNAL`: route is not a primary menu destination.

## Authentication and landing

| Route | Status | Primary roles | Notes |
|---|---|---|---|
| `/login` | VERIFIED | Public staff entry | English/Arabic sign-in, existing-session state, safe return URL |
| `/dashboard` | VERIFIED | Fallback and admin-capable users | Role-aware redirect and theme-specific dashboard presentations |
| `/owner-control` | PARTIAL | Owner, Admin, Super Admin | Canonical owner/admin landing |
| `/doctor` | VERIFIED | Doctor, Owner/Admin | Canonical doctor landing |
| `/reception` | VERIFIED | Receptionist, Owner/Admin | Canonical receptionist landing |

## Reception and patient-entry routes

| Route | Status | Registry source |
|---|---|---|
| `/reception` | VERIFIED | Reception home |
| `/reception/check-in` | PARTIAL | Reception patient search/check-in workflow |
| `/reception/qr-scan` | VERIFIED | Returning patient / QR workflow |
| `/patients/new` | VERIFIED | New patient registration |
| `/queue` | VERIFIED | Waiting line / queue |
| `/appointments` | PARTIAL | Appointment workflow |
| `/calendar` | VERIFIED | Clinic calendar |

## Patient routes

| Route | Status | Notes |
|---|---|---|
| `/patients` | VERIFIED | Patient directory |
| `/patients/:patientId` | DYNAMIC | Main patient workspace |
| `/patients/:patientId/visits/:encounterId` | DYNAMIC | Active doctor visit workspace |
| `/clinical-tags` | VERIFIED | Smart Clinical Search |
| `/external-intake` | VERIFIED | External Intake Inbox |
| `/doctor/case-library` | VERIFIED | Doctor case library |

## Clinical operation routes

| Route | Status | Notes |
|---|---|---|
| `/doctor/waiting` | VERIFIED | Doctor waiting list |
| `/encounters` | VERIFIED | Encounter list |
| `/prescriptions` | VERIFIED | Prescription center/templates/reference workflow |
| `/investigations` | VERIFIED | Investigation catalog and orders |
| `/ultrasound` | VERIFIED | OB/GYN ultrasound workspace |
| `/pregnancies` | PARTIAL | Pregnancy workspace/calendar |
| `/reports` | VERIFIED | Clinical reports |
| `/documents` | VERIFIED | Patient and clinic documents |
| `/consents` | PARTIAL | Consent records |
| `/tasks` | VERIFIED | Operational and patient tasks |
| `/staff-chat` | VERIFIED | Staff messaging for permitted roles |

## Knowledge and assisted-work routes

| Route | Status | Notes |
|---|---|---|
| `/guidelines` | VERIFIED | Guideline center |
| `/guidelines/:guidelineId` | DYNAMIC | Guideline detail, source file, summary and metadata modes |
| `/protocol-atlas` | VERIFIED | Protocol Atlas |
| `/medications` | VERIFIED | Pharmacology / medication reference |
| `/ai-assistant` | VERIFIED | Draft-only clinical assistance tools |
| `/ai-drafts` | PARTIAL | AI draft review workflow |

## Finance routes

| Route | Status | Notes |
|---|---|---|
| `/billing` | VERIFIED | Invoices, payments and finance workflow |
| `/reports` | VERIFIED | Includes operational/clinical reporting access depending on role |

## Administration routes

| Route | Status | Registry label |
|---|---|---|
| `/admin` | VERIFIED | Admin control center |
| `/admin/accounts` | VERIFIED | Users & Roles |
| `/admin/services` | VERIFIED | Services |
| `/admin/investigations` | VERIFIED | Investigation Catalog |
| `/admin/drug-market/import` | VERIFIED | Medication Data |
| `/admin/settings` | VERIFIED | Clinic Settings |
| `/admin/security-readiness` | VERIFIED | Security |
| `/admin/appearance` | VERIFIED | Appearance |
| `/admin/audit` | VERIFIED | Audit |

## Patient workspace tabs

The frozen source registers the following patient tabs. Each tab must be treated as an independent submodule during the later split, even when several tabs share one route.

1. Summary
2. Medical
3. Clinical
4. Care Assist
5. Appointments
6. Encounters
7. Prescriptions
8. Orders
9. Results
10. Reports
11. Documents
12. Pregnancy
13. Ultrasound
14. Billing
15. Consents
16. Referrals
17. Tasks
18. Internal Notes
19. AI Drafts
20. Protocol Atlas
21. Calculators
22. Medications
23. Allergies
24. Herbal/Supplements
25. Medication Safety
26. Prescription Safety
27. Timeline
28. Print Packet

## Print routes requiring dedicated validation

| Route | Status | Target |
|---|---|---|
| `/print/patient/:patientId` | PRINT | Patient packet / A4 |
| `/print/prescription/:prescriptionId` | PRINT | Prescription / A5 |
| `/print/investigation/:investigationId` | PRINT | Investigation request / A4 or configured format |

## Route acceptance work still required

For every route above, the next inventory pass must record:

- source page/component path
- shell type
- role and permission requirements
- API calls
- loading state
- empty state
- error state
- success state
- desktop screenshot at 1440×900
- mobile screenshot at 390×844
- Arabic/RTL result
- keyboard and mouse interaction notes
- print behavior when applicable

No route is eligible for redesign until its Golden Master record is complete.
