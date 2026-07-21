# Reception Module — Current State

## Branch

`work/reception-module-v1`

## Source baseline

The Reception module is derived from the approved Golden Master branch:

`golden-master/prij-identical-copy`

No production branch is modified by this module work.

## Current routes

- `/reception`
- `/reception/check-in`
- `/reception/qr-scan`
- `/patients/new`
- `/patients`
- `/queue`
- `/calendar`

## Current Reception Home

Source: `apps/web/app/reception/page.tsx`

The current home page contains:

- Reception title
- Check in patient action
- New patient action
- Open queue action
- Queue preview
- Waiting count
- Urgent count
- Next patient
- Refresh action

The queue preview loads from:

`GET /queue/today`

It refreshes when the application publishes the `clinic-queue:changed` event.

## Current Check-in workflow

Source: `apps/web/app/reception/check-in/page.tsx`

Current flow:

1. Search or load a patient.
2. Preserve the selected patient in `sessionStorage`.
3. Choose visit type.
4. Submit an idempotent queue check-in.
5. Show queue number, visit type and waiting status.
6. Publish queue, patient, timeline and owner-operation refresh events.

Write endpoint:

`POST /queue/check-in`

Required payload fields include:

- patient ID
- visit type
- routine or priority status
- reception check-in method

The current implementation prevents duplicate submission through an idempotency key and reports when a patient is already in the queue.

## Current Queue workflow

The Queue route is rendered by the shared `ClinicOperationsPage` engine.

Current capabilities include:

- waiting list
- urgent prioritization
- next-patient indication
- queue number
- waiting duration
- open patient profile
- call patient
- cancelled history
- English and Arabic labels

The shared queue engine must not be duplicated inside Reception. Reception should consume the same queue state and transitions.

## Shared dependencies

The Reception module depends on:

- `AppShell`
- role-aware navigation registry
- `PatientPicker`
- `VisitTypeSelector`
- `ThreeDMedicalIcon`
- safe API error formatting
- idempotency support
- clinic data-change events
- queue API contracts
- patient search API contracts
- i18n and RTL providers

## Confirmed desktop baseline

The current desktop Reception shell has:

- dark green left sidebar
- Reception, New Patient, Returning Patient / QR, Waiting Line and Calendar entries
- warm ivory page canvas
- three full-width action cards
- queue preview card

## Confirmed mobile baseline

The mobile page has:

- compact header
- truncated clinic name
- stacked reception actions
- queue preview
- mobile-safe RTL switch

## Existing baseline defects

These defects are part of the source baseline and must not be confused with upgrade regressions:

1. The Arabic queue preview still shows the English word `Refresh`.
2. The mobile clinic name is truncated.
3. The three main actions consume substantial vertical space.
4. Reception Home does not show today’s appointments.
5. Reception Home does not show patient names in the waiting preview beyond the next patient.
6. The receptionist must navigate away from Home for most work.
7. Queue refresh is manual except for queue-change events.
8. There is no compact at-a-glance breakdown of scheduled, arrived, waiting, with doctor and completed patients.
9. Reception Home does not expose intake, consent or payment-readiness status.
10. The current desktop sidebar exposes more navigation than the desired receptionist-only single-workspace model.

## Safety and permission boundaries

Reception may manage operational workflow but must not expose or edit clinical documentation.

Reception may own:

- patient registration
- returning-patient lookup
- appointment creation and status
- check-in
- queue placement
- operational queue transitions allowed by permission
- contact and intake verification
- non-clinical notes
- payment-status visibility when authorized

Reception must not own:

- clinical notes
- diagnosis
- prescriptions
- investigation interpretation
- ultrasound findings
- doctor-only safety decisions
- unrestricted patient search across unauthorized branches

## Upgrade objective

Transform Reception into one fast, mouse-first operational workspace while preserving:

- existing queue and patient APIs
- role boundaries
- branch scoping
- idempotent check-in
- Arabic RTL
- current audit and security behavior
- live queue refresh events

The upgrade must reduce navigation and typing without creating a separate queue implementation.
