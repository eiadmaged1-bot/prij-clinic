# QA Compact Calendar and History Cleanup

Tickets: `QA-CAL-001`, `QA-HIST-001`

## Calendar acceptance

- Use the existing source-linked calendar events; do not create duplicate clinical data.
- Cap the desktop calendar container at 760 px while remaining responsive.
- Keep a seven-column month grid.
- Desktop day cells use a 38 px minimum height; mobile day cells use 34 px.
- Show at most two event labels inside a day and render a `+N` overflow count for additional events.
- Use a compact previous / month / current-month / next toolbar.
- Preserve full event text in accessible titles and preserve links to source encounters.
- Preserve pregnancy-dating and pregnancy-bleeding semantics introduced by `QA-PREG-001` and `QA-EDD-001`.

## History acceptance

- Keep the full reproductive record source-linked and immutable.
- Replace the dense ambiguous filter expression with a readable filtered set.
- Add explicit pregnancy and menopause filters.
- Show a compact current pregnancy dating summary with authoritative EDD, dating source, clinician, confirmation date, and correction-history count.
- Keep the pre-pregnancy menstrual baseline visible as historical context.
- Do not calculate or display an ordinary cycle day for pregnancy snapshots.
- Use compact record cards with collapsible source/provenance details.
- Preserve pregnancy-specific bleeding fields and EDD correction history.

## Verification

- `node scripts/qa-calendar-history-contract-test.mjs`
- `node scripts/qa-pregnancy-edd-contract-test.mjs`
- `node scripts/feature-46-refractory-complaint-test.mjs`
- Typecheck and production build.
- Final SECTRA regression must additionally pass clinical workflow, medication, and search checks.

No migration, seed, reset, delete, truncate, reference-data mutation, or production-data change.