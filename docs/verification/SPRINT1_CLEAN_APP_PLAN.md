# Sprint 1 Clean App Integration Plan

1. Preserve `work/sprint1-qa-repair-batch` with a dated backup branch.
2. Start `work/sprint1-feature47-rx-med-final` from the current app branch.
3. Apply only compact medication cards, structured Arabic prescription controls, and the explicit medication safety boundary.
4. Re-run Feature 46, pregnancy/EDD, Feature 47, medication regressions, typecheck, production build, and diff safety.
5. Commit only the three application files and verification evidence.
6. Open a minimal PR back to `work/sprint1-qa-repair-batch`.

No migration, seed, reset, deletion, truncation, production-data mutation, or secret modification is permitted.
