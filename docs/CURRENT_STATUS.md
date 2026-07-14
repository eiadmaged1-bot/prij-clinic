# Current Status

Date: 2026-07-14 (Africa/Cairo). Branch: `fix/v1.4.4-role-runtime-clinical-workflow-reconstruction`.

## Verified v1.4.4 work

- Central secure idempotency UUID generation now supports native `randomUUID`, secure `getRandomValues` fallback via `uuid`, SSR import, stable attempts, retry, refresh, and double-submit behavior.
- Production-safe localized error classification and loopback-only API / same-origin web UAT scripts are present.
- Reception desktop/mobile navigation and operational actions were repaired; Doctor dashboard now uses real scoped operational counts and active-visit actions.
- Real prescriptions and investigation requests require patient plus active encounter context. Standalone pages are template/library/follow-up centers.
- Dedicated patient-linked A5 prescription and A4 investigation request print routes are present.
- Investigation sets support bilingual personal metadata and permission-gated branch/clinic scopes. The catalog remains extensible rather than claimed comprehensive.
- Smart Clinical Search stores assignment provenance, source encounter, confirmation, status/effective/resolution dates, and exposes AND/OR/NOT matching evidence. Derived tags are not searchable until confirmed.
- External intake preserves signed UTF-8 raw bytes, isolates dry runs, proves Arabic round-trip, and uses patient search/candidate comparison without automatic merging.
- Owner/Admin patient CSV/XLSX import uses in-memory hashing, mapping, encoding selection, mandatory preview, row validation, duplicate blocking, selected commits, and batch/row audit records.
- Guideline cards open a stable-ID section viewer. PDF/TXT/Markdown upload, secure storage, indexing, review, RBAC, and audit are connected.
- Arabic now sets the global document to `lang=ar` and `dir=rtl`; core navigation/session translations and Arabic-aware clinical search/import validation are verified.

Forward-only migrations added in this sprint: prescription dispensing metadata, investigation set scopes, clinical-tag provenance/confirmation, and patient import batches. No historical migration was rewritten and the database was not reset.

This is development verification, not production, privacy, deployment, or clinical-governance signoff.

Final verification results and unavailable legacy suites are recorded in `docs/MANUAL_QA_REPORT.md`.
# v1.4.5 reconstruction (2026-07-14)

Implemented on `fix/v1.4.5-mobile-workflow-knowledge-reconstruction`: role-safe landings, shared sticky mobile header/account sheet, compact Reception and Doctor workspaces, idempotent patient-to-queue handoff, deterministic hydration, permanent PHI-free QR workflow, guided patient workspace, reversible/amendable clinical tags, resilient autosave/session handling, authoritative PDF guideline viewer, reviewed page-cited summaries/search, generic-first pharmacology, approved formula calculators, Dermatology reference search, and audited encounter-linked findings. Clinical knowledge output remains assistive and doctor-review gated.
