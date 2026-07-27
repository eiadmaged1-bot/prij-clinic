# Sprint 2A Patient Foundation and Clinical Context Repair

Status: PASS

## Patient creation contract

- The doctor quick-create form starts with a real `OBSTETRIC` value rather than an invisible legacy `WOMEN_HEALTH` state.
- Creation choices are Pregnancy / Obstetric, Gynecology, Fertility, and Undetermined.
- High-risk obstetric and postpartum are not selectable patient-creation types.
- Doctor quick creation uses the governed create-and-start-visit endpoint.
- The selected context is sent without a silent fallback.
- Birth year is validated before submission.
- API validation arrays, duplicate-review conflicts, permission failures, and MRN conflicts surface specific messages.

## Persistence and identity

- `yearOfBirth` is returned in the patient workspace summary.
- Age falls back safely to `yearOfBirth` when exact date of birth is not yet available.
- Patient page and identity header preserve the returned birth year after refresh.
- Selected patient context remains available to the clinical workspace.
- Patient directory filters now use grouped base contexts, so legacy high-risk and postpartum records remain discoverable under Pregnancy / Obstetric without presenting them as patient types.
- Legacy Preventive / Well-woman records are presented under the Gynecology base context until episode-level phase work is completed.

## Verification

- Sprint 2A focused contract: PASS
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
- Existing patient records changed: NONE
- Production data mutation: NONE
- Secrets changed or exposed: NONE
