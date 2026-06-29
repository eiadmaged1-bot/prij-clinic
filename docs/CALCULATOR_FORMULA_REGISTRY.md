# Calculator Formula Registry

`CalculatorFormula` is the source catalog for calculator metadata and governance.

## Status Values

- `verified`: safe handler implementation exists and can produce clinical calculation output.
- `draft`: formula metadata exists, but clinical output is blocked.
- `catalog_only`: formula is known as a future item, but no calculator output is allowed.
- `retired`: formula should not be used.

## Governance

Admin registry UI is available at `/admin/calculators` for Owner/Admin users. It allows metadata-only edits: source, version, limitations, status, and active flag. It does not allow dynamic code editing.

Marking formulas verified or retired requires a reason and writes an audit event. Actual formula logic still requires reviewed handler implementation in code.
