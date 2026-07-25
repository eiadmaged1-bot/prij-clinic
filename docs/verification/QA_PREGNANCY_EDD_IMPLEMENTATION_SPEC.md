# QA Pregnancy Context and EDD Safeguards

Tickets: `QA-PREG-001`, `QA-EDD-001`

## Clinical workflow guard

- An active pregnancy must not be presented as an ordinary active menstrual cycle.
- Preserve historical LMP and the pre-pregnancy menstrual baseline; do not delete or rewrite prior records.
- Pregnancy bleeding must be recorded in pregnancy-specific fields and must not reuse ordinary menstrual abnormality flags.
- Signed encounter snapshots remain immutable and source-linked.

## EDD modes

- `manual`: clinician enters a proposed EDD.
- `calculated`: system produces a candidate from one explicit source:
  - LMP: first day of LMP + 280 days.
  - Known conception: conception date + 266 days.
  - IVF embryo transfer: day-5 transfer + 261 days; day-3 transfer + 263 days.
  - Ultrasound: explicit scan EDD, or scan date plus the remaining days to 280 from recorded gestational weeks and days.

## Safety and provenance

- Calculations are previews until a clinician explicitly confirms the authoritative EDD.
- Never infer dates from free text.
- Never silently replace a confirmed EDD.
- Replacing a different confirmed EDD requires an explicit replacement action and a correction reason.
- Preserve source, source date, mode, confirmation date, clinician, correction reason, previous EDD, and dating history.
- Use ISO date-only, UTC-safe arithmetic.
- Do not implement automatic ultrasound redating thresholds in this package; that requires an approved local protocol and separate validated rule tests.

## Reference basis

- ACOG Committee Opinion No. 700, *Methods for Estimating the Due Date*, reaffirmed 2025.
- The implementation is arithmetic and provenance support only. Clinical adoption and redating remain doctor-controlled.

## Acceptance

- `node scripts/qa-pregnancy-edd-contract-test.mjs` passes.
- Existing Feature 46 and Sprint 1 checks remain green.
- Typecheck and production build pass.
- No migration, seed, database reset, reference-data mutation, or production-data change.
