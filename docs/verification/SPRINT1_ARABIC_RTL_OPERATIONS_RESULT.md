# Sprint 1 Arabic and RTL Critical Operations

Status: PASS

## Language foundation

- Arabic and English dictionaries have matching keys.
- The stored language is applied to `<html lang>` and `<html dir>` before the app paints.
- Language changes synchronize across tabs and update the document immediately.
- The Arabic clinic name is visible in Arabic mode.
- Critical bilingual sources are free from mojibake.

## Critical operations translated

- Offline/autosave health states and recovery actions are bilingual.
- Active-visit tabs, persistent actions, synchronization recovery, signing confirmation, voiding confirmation, core encounter fields, medication actions, ultrasound labels, and follow-up actions are bilingual.
- Doctor handoff, queue selection, current patient, waiting patients, and safe-queue rules are bilingual.
- Reception Home remains bilingual and isolated.

## RTL behavior

- Arabic mode uses document-level RTL.
- Top bars, cards, forms, dialogs, action rows, active-visit tabs, and sync-health popovers use logical alignment.
- MRNs, visit IDs, queue numbers, dates, telephone numbers, and numeric inputs remain isolated left-to-right.
- Desktop and mobile layouts preserve usable actions in RTL.

## Verification

- Arabic/RTL operations contract: PASS
- Offline Sync Health regression: PASS
- Patient Safety Core regression: PASS
- Reception and Queue Core regressions: PASS
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
