# Dependency Audit

Date: 2026-07-14. Command: `npm audit --json`. No force fix was used.

Totals: 0 critical, 7 high, 14 moderate, 3 low (24 total). No safe non-breaking update was applied in this sprint.

| High finding | Scope | Directness / reachability | Update and mitigation |
| --- | --- | --- | --- |
| `@nestjs/cli` | Development | Direct; build tooling only | Audit offers Nest CLI 11, a breaking major. Keep out of runtime images and upgrade in a dedicated Nest 11 change. |
| `glob` | Development | Transitive through Nest CLI; vulnerable CLI `-c` path is not used by the application | Fixed only through the breaking Nest CLI chain. Do not invoke untrusted glob CLI commands. |
| `picomatch` | Development | Transitive through Angular devkit/Nest CLI; not runtime-reachable | Fixed only through the breaking tooling chain. Do not feed untrusted patterns into build tooling. |
| `tmp` | Development | Transitive through external-editor/inquirer/Nest CLI; not runtime-reachable | Fixed only through the breaking tooling chain. Build tooling remains local/CI-only. |
| `@nestjs/platform-express` | Production | Direct; runtime framework | Audit aggregates Express/body-parser/multer advisories and offers Nest 11 only. Maintain strict body/file bounds and plan a tested Nest major upgrade. |
| `multer` | Production | Transitive and reachable through upload endpoints | Versions below 2.2.0 have DoS findings; npm offers only the Nest platform major in this tree. Existing request/file limits, quarantine, validation, and metadata sanitization are temporary mitigations. Prioritize controlled upgrade. |
| `xlsx` | Production/tooling | Direct and reachable in medication spreadsheet import | Prototype-pollution/ReDoS findings have no npm fix. Import remains Owner/Admin-only, bounded, dry-run/review-gated, and provenance-tracked. Evaluate a maintained replacement or controlled upstream upgrade. |

Moderate and low findings remain tracked by the audit output and should be re-evaluated with the planned tooling/framework upgrade. `npm audit fix --force` is prohibited because it would introduce unreviewed breaking changes.
