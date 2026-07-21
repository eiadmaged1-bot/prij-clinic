# Reception Command Center — Manual QA

## Branch

`work/reception-module-v1`

## Required role

Receptionist-only local account.

Do not use real PHI/PII for testing. Use an existing safe QA/training record only when a write-path check is intentionally performed.

## Desktop checks

- [ ] Receptionist sidebar shows Reception only.
- [ ] Language and Logout remain available from account controls.
- [ ] Reception Command Center loads without horizontal overflow.
- [ ] Appointment, checked-in, waiting, and urgent counts load from live APIs.
- [ ] Refresh reloads appointments and queue without changing records.
- [ ] Patient search accepts name, phone, MRN, and permanent QR text.
- [ ] Selecting a patient persists while navigating inside Reception workflows.
- [ ] New Patient opens the existing registration route.
- [ ] Permanent QR opens the existing QR route.
- [ ] Open profile shows the receptionist-safe patient profile.
- [ ] Check-in requires patient and visit type.
- [ ] Repeated check-in does not create a duplicate queue entry.
- [ ] Appointment booking requires patient, visit type, date, and time.
- [ ] Duration buttons set 15, 30, 45, or 60 minutes.
- [ ] Appointment creation refreshes Today's appointments.
- [ ] Next to doctor displays patient name only.
- [ ] Today's appointment rows can select the patient for check-in.
- [ ] Waiting-line rows can select the patient context.
- [ ] No clinical notes, diagnoses, prescriptions, AI, or admin tools are visible.

## Mobile English — 390 × 844

- [ ] Header and account controls fit.
- [ ] Metrics render as a readable two-column grid.
- [ ] Quick actions remain mouse/touch friendly.
- [ ] Patient search results do not overflow.
- [ ] Selected-patient actions stack correctly.
- [ ] Check-in cards and appointment controls remain usable.
- [ ] Appointment and queue rows stack without text collision.

## Mobile Arabic — 390 × 844

- [ ] Page direction is RTL.
- [ ] Reception labels are Arabic, including Refresh.
- [ ] Cards, buttons, dates, and lists align correctly.
- [ ] Patient names and MRNs remain readable in mixed-direction content.
- [ ] No horizontal overflow appears.

## Safety and permissions

- [ ] Direct access to Owner/Admin/Doctor routes redirects safely.
- [ ] Receptionist cannot see finance details unless separately authorized.
- [ ] Network errors preserve current selection and show safe messages.
- [ ] No raw storage paths, stack traces, tokens, or request bodies appear.

## Evidence screenshots

Capture:

1. Desktop Reception Command Center — top and workflow sections.
2. Desktop selected-patient check-in panel.
3. Desktop appointment panel.
4. Mobile English top.
5. Mobile English lower workflow.
6. Mobile Arabic top.
7. Mobile Arabic lower workflow.

## Approval states

- `PASS` — ready to freeze the Reception module.
- `PASS WITH MINOR FIXES` — only listed visual/text corrections remain.
- `FAIL` — role leakage, write failure, data duplication, broken mobile layout, or unsafe information exposure.