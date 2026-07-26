# Sprint 1 Evidence Audit

- Generated: `2026-07-26T15:49:10.141Z`
- Source branch: `work/sprint1-qa-repair-batch`
- Method: explicit `Feature N` or `FN` references only; ordinary numeric matches are excluded.
- Runtime verification before report generation: Feature 46, pregnancy/EDD, Feature 47, medication UI, typecheck, production build, and diff safety.
- Migration/seed/reset/delete/truncate: NOT RUN
- Production data modified: NO
- Secrets changed or printed: NO

## Integrated Gate State

| Gate | Status |
|---|---|
| cleanIntegrationEvidence | PASS |
| feature46Contract | PASS |
| pregnancyEddContract | PASS |
| feature47Contract | PASS |
| compactMedicationCards | PASS |
| structuredArabicPrescription | PASS |
| noAutoPrescribingBoundary | PASS |
| compactCalendarAndHistory | PASS |

## Feature Evidence Map

| Feature | Audit status | Traces | Source | Tests | Evidence | Representative paths |
|---:|---|---:|---:|---:|---:|---|
| 7 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 8 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 9 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 13 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 15 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 17 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 18 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 22 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 23 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 28 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 45 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 46 | VERIFIED | 15 | 0 | 1 | 14 | `docs/verification/FEATURE47_CALENDAR_HISTORY_HOSTED_VERIFICATION.md`<br>`docs/verification/FEATURE_46_VERIFICATION.md`<br>`docs/verification/FEATURE_48_VERIFICATION.md`<br>`docs/verification/FEATURE_49_VERIFICATION.md`<br>`docs/verification/QA_CALENDAR_HISTORY_IMPLEMENTATION_SPEC.md`<br>`docs/verification/QA_CALENDAR_HISTORY_PURE_VERIFY.md`<br>`docs/verification/QA_PREGNANCY_EDD_IMPLEMENTATION_SPEC.md`<br>`docs/verification/QA_PREGNANCY_EDD_PURE_VERIFY.md` |
| 47 | VERIFIED | 5 | 0 | 0 | 5 | `docs/verification/FEATURE47_CALENDAR_HISTORY_HOSTED_VERIFICATION.md`<br>`docs/verification/FEATURE_48_VERIFICATION.md`<br>`docs/verification/FEATURE_49_VERIFICATION.md`<br>`docs/verification/SPRINT1_CLEAN_APP_INTEGRATION.md`<br>`docs/verification/SPRINT1_EVIDENCE_AUDIT.md` |
| 48 | VERIFIED | 5 | 0 | 1 | 4 | `docs/verification/FEATURE_48_49_REGISTRY.md`<br>`docs/verification/FEATURE_48_VERIFICATION.md`<br>`docs/verification/SPRINT1_EVIDENCE_AUDIT.json`<br>`docs/verification/SPRINT1_EVIDENCE_AUDIT.md`<br>`scripts/feature-48-compact-medication-cards-test.mjs` |
| 49 | VERIFIED | 5 | 0 | 1 | 4 | `docs/verification/FEATURE_48_49_REGISTRY.md`<br>`docs/verification/FEATURE_49_VERIFICATION.md`<br>`docs/verification/SPRINT1_EVIDENCE_AUDIT.json`<br>`docs/verification/SPRINT1_EVIDENCE_AUDIT.md`<br>`scripts/feature-49-structured-arabic-prescription-test.mjs` |
| 101 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 102 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 106 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 107 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 108 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 109 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 110 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 111 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 115 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 119 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 150 | UNMAPPED | 0 | 0 | 0 | 0 | — |
| 200 | UNMAPPED | 0 | 0 | 0 | 0 | — |

## Status Totals

- UNMAPPED: 23
- VERIFIED: 4

## Interpretation

- `VERIFIED`: explicit evidence includes a passing verification artifact and a source or test anchor.
- `TESTED TRACE`: explicit source and test anchors exist, but no passing evidence artifact was found.
- `TRACE ONLY`: an explicit feature reference exists but completion is not proven.
- `UNMAPPED`: no explicit repository mapping was found; define acceptance criteria before implementation.

## Next Roadmap Gate

Feature 48 already has verified explicit evidence; select the next unmapped roadmap item.
