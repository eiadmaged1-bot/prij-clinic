# Medication Reference and Import

## Reference search

Pharmacology search supports generic name, brand/trade name, ingredient, family/class, function, alias, strength, dosage form, and country where data exists. Search works by button or Enter, and family/category chips narrow results. Selecting a medication opens its profile; no selection shows a clear prompt instead of a blank panel.

Profiles display only stored source-backed fields: generic/brands, class, form/strength, warnings, pregnancy/lactation reference fields, interactions, allergy context, source, review status, last review, and country availability. Missing data is shown as unavailable/unknown and never interpreted as safe.

Observed sprint baseline: 35 generic rows, 53 family rows, 1 product row, 15 market variants, 30 drug-market source rows, and 7 medication-data source rows. All 15 variants are demo/reference fixtures; non-demo/official variants, verified official rows, import runs, and open review items remain 0.

## Owner/Admin import

Data Management accepts CSV, Excel, and JSON. The workflow provides upload, column mapping, dry run, validation, duplicate detection, error report, batch summary, review queue, auditing, and safe batch archive. Imported rows always begin as `needs_review`; verified rows are not silently overwritten, and rollback/archive is limited to safe records.

Every import records source name, source URL or file provenance, import date, version, verification status, reviewer, and last-reviewed time where applicable. Allowed inputs are official public regulatory data, official exports, open terminology datasets, and owner-provided licensed files. Login/CAPTCHA/paywall bypass, pharmacy stock/cart data, retail self-use instructions, and silent overwrite are forbidden.

Medication reference remains assistive. It cannot auto-diagnose, auto-prescribe, auto-select treatment or dose, or bypass doctor review. A review label indicates catalog governance only; it is not a general medication-safety claim.
