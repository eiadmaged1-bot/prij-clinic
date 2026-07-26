# Sprint 1 Reception and Queue Core

Status: PASS

## Receptionist isolation

- Receptionist desktop and mobile shells have no full sidebar or bottom navigation.
- The top bar exposes Reception Home, language switching, and Logout.
- Global clinical search is hidden from receptionist-only accounts.
- Reception Home is one workspace with New Patient, Returning Patient, Waiting Line, and live clinic status.
- The live status displays the current patient name only.
- Doctor, owner, prescription, and encounter actions are not exposed on Reception Home.

## Queue reliability

- Only one patient can hold the called state for a working branch and clinic day.
- Selecting another waiting patient safely returns an unstarted called ticket to waiting.
- A patient already in the doctor room blocks another selection with `DOCTOR_ROOM_OCCUPIED`.
- Concurrent queue selection conflicts return `QUEUE_SELECTION_CONFLICT`.
- Every waiting row has a unique ticket-bound Open and Start action.
- Pick next follows urgent-first, then check-in and queue order.
- Doctor actions are Open, Continue, and Complete.
- Complete opens the governed visit finish/sign workflow and never bypasses signing.

## Verification

- Reception and queue core contract: PASS
- Receptionist isolation regression: PASS
- Reception patient/queue workflow: PASS
- Queue recovery workflow: PASS
- Route authorization: PASS
- Role visibility: PASS
- Patient safety core regression: PASS
- Features 46–49 regressions: PASS
- Medication regressions: PASS
- Typecheck: PASS
- Production build: PASS
- git diff --check: PASS

## Data safety

- Database migration: NOT RUN
- Database seed: NOT RUN
- Database reset/delete/truncate: NOT RUN
- Production data mutation: NONE
- Secrets changed or exposed: NONE
