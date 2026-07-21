# Reception Module — Approved Design

## Decision

Option A — Single Command Center is approved.

## Branch

`work/reception-module-v1`

## Source baseline

`golden-master/prij-identical-copy`

## Locked workflow

```text
Reception command center
→ Search or select patient
→ Use selected-patient actions
→ Check in, book appointment, open profile, or use permanent QR
→ Monitor today's appointments and live waiting line
→ Hand patient to doctor through the existing queue contract
```

## Navigation decision

Receptionist-only accounts keep one permanent workspace destination:

- Reception Home

Language and Logout remain available from the account controls.

The following existing routes remain operational but move out of permanent navigation and into the command center:

- New Patient
- Returning Patient / QR
- Waiting Line
- Calendar
- Check-in

## MVP contents

- Reception header and refresh action
- Today's operational counts
- Persistent patient search and selected-patient context
- New patient action
- Permanent QR action
- Patient check-in with required visit type
- Appointment booking for the selected patient
- Today's appointments list
- Live waiting-line list
- Next-to-doctor name-only signal
- English and Arabic RTL copy
- Existing RBAC, idempotency, audit, and API contracts preserved

## Explicit exclusions

- No clinical notes or clinical detail exposure
- No AI tools
- No admin controls
- No billing redesign
- No new database schema
- No fake/demo patient generation
- No automatic doctor action
- No replacement of the shared PatientPicker

## Acceptance rule

The module is ready for manual review only after typecheck/build tests pass and the receptionist desktop, mobile English, and mobile Arabic workflows are captured.