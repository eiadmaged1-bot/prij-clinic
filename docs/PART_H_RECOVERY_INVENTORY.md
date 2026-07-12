# Part H Recovery Inventory

## Recovery Baseline

- Recovery inventory began at `81e25e9`; the resumed correction began at committed HEAD `209206a` on `release/production-launch-consolidation`.
- The resumed worktree was intentionally dirty and was preserved. It contained the patient-domain extraction, workspace sidecars, Part H scripts, package wiring, and this inventory draft.
- Existing Parts A-G, authentication/session behavior, CSRF, document encryption, concurrency protections, interface modes, and role permissions remained in scope for regression protection.
- Password functionality was frozen and was not modified.

## Initial Findings and Disposition

| Finding | Disposition |
| --- | --- |
| Duplicate-candidate filtering excluded patients whose notes were null | Corrected in the patient search domain and verified behaviorally on three fresh databases. |
| Patient architecture checks were static | Replaced with an API-booting behavioral test using unique fixtures. |
| Generated workspace sidecars were incomplete | Reviewed, repaired, integrated by domain, and kept only where they own real workspace responsibility. |
| `split-workspace.mjs` was an unsafe, non-idempotent one-off generator | Reviewed and removed; no unique runtime logic was lost. |
| A replacement `patient-components.tsx` monolith remained | Reduced from 2,819 historical lines to 1,312 lines; the largest extracted sidecar is 742 lines. |
| `encounter.delete` was an invented UI permission | Replaced by audited, reason-required `encounter.void`, enforced by the backend. |
| Timeline bounded each source then sliced globally | Replaced by a stable cursor contract and behavioral multi-page verification. |
| Request and bundle budgets shared superficial checks | Replaced by separate Playwright network and Next build-output tests. |
| Manual QA documents were duplicated and one used unsafe database guidance | Consolidated into `MANUAL_QA_WAVE_1.md` and `MANUAL_QA_WAVE_1_STARTUP.md`; QA remains pending. |

No `package-lock.json` change was required. No accidental source file remains outside the intended API, web, scripts, migration, or documentation areas.

## Database Safety and Incident

The prior `npx prisma db push --accept-data-loss` incident affected local persistent-development database `prij_clinic_dev`. It dropped 18 Guideline columns and 10 indexes. No row deletion was reported, but values stored in dropped columns were lost unless recoverable from a trustworthy pre-incident backup. The identified command did not target an active clinic database. The persistent database was not repaired or mutated during this recovery sprint.

Every writable Part H verification used a newly created disposable PostgreSQL database whose name contained `_test_part_h_`. The final migration-chain database was `prij_clinic_test_part_h_chain_final`. No migration was applied to an active or persistent database.

## Completed Checkpoints

1. Incident evidence and recovery options documented without persistent-database mutation.
2. Forward-only Part H indexes justified and all 46 migrations deployed on a fresh disposable database with no drift.
3. Patient search, lookup, duplicate candidates, registration, branch scope, authorization, and concurrency verified behaviorally.
4. Patient workspace split into bounded sidecars with one authoritative 16-module registry and lazy heavy-module boundaries.
5. Frontend action policy aligned with shared permissions and authoritative backend denial behavior.
6. Patient timeline changed to stable, bounded, permission-filtered cursor pagination.
7. Real browser request counts and real build-output bundle boundaries measured.
8. Ten distinct Part H verification scripts provide behavioral coverage where required.
9. Parts A-G regressions, all workspace typechecks, one final production build, and bundle verification passed.
10. Manual QA Wave 1 documentation prepared; no Manual QA was executed.

## Remaining Manual/Operational Work

- Execute Manual QA Wave 1 only after explicit approval, using the disposable startup procedure.
- Visually verify Arabic RTL, all specified viewports, browser history, and role workflows; automated checks do not replace this manual evidence.
- Assess a pre-incident backup in isolation before deciding whether to recover `prij_clinic_dev`.
- Review the two unchanged legacy module cycles (`audit`/`auth` and `auth`/`users`) in a later authorized architecture sprint.
- Keep Part I, offline sync, and AI work out of this recovery checkpoint.
