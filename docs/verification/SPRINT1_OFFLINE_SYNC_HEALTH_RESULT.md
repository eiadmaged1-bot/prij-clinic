# Sprint 1 Offline Autosave and Sync Health

Status: PASS

## Offline draft safety

- Unsigned doctor-visit changes are saved locally after a short debounce.
- Queue records are locked to the exact patient and encounter.
- Authentication tokens, cookies, passwords, and secrets are excluded from persisted queue payloads.
- One queued record replaces older queued changes for the same patient and encounter.
- A signed visit remains read only.

## Synchronization

- Online edits autosync to the existing optimistic-concurrency visit endpoint.
- Offline edits remain pending and retry when connectivity returns.
- Failed items remain visible and retryable.
- Successful items are removed from the local queue and the server visit is reloaded.
- Concurrent sends are protected by an in-tab synchronization lock.

## Conflict recovery

- `VISIT_DRAFT_STALE`, `ENCOUNTER_SIGN_CONFLICT`, and HTTP 409 responses become explicit conflicts.
- Conflict items are preserved locally.
- Conflict items never overwrite the server automatically.
- The user can discard the local copy and reload the server version.
- Visit signing and printing are blocked until the draft is fully synchronized.

## Health visibility

- The authenticated shell displays Online/Offline, pending, failed, and conflict state.
- The global indicator exposes counts only; it does not expose patient identity or clinical text.
- Receptionist and clinical shells both receive the compact health indicator.
- Mobile layout keeps the indicator and conflict actions usable.

## Verification

- Offline sync contract: PASS
- Patient Safety Core regression: PASS
- Receptionist and Queue Core regressions: PASS
- Features 46–49 regressions: PASS
- Medication regressions: PASS
- Typecheck: PASS
- Production build: PASS
- Exact scope and git diff check: PASS

## Data safety

- Database migration: NOT RUN
- Database seed: NOT RUN
- Database reset/delete/truncate: NOT RUN
- Production data mutation: NONE
- Secrets changed or exposed: NONE
