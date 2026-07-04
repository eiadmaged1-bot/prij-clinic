# Medication Safety Source Import Format

Supported owner-provided formats:
- CSV
- JSON array of row objects
- Simple structured text with CSV-style columns

Required fields:
- `genericName`
- `legacyPregnancyCategory`
- `lactationRiskLevel`
- `sourceName`
- `sourceType`
- `confidenceLevel`
- `reviewStatus`

Optional fields:
- `pregnancyRiskSummary`
- `pregnancyClinicalConsiderations`
- `pregnancyDataSummary`
- `lactationRiskSummary`
- `lactationMilkTransferSummary`
- `lactationInfantEffectsSummary`
- `lactationClinicalConsiderations`
- `reproductivePotentialNotes`
- `sourceUrl`
- `sourceYear`

Allowed `legacyPregnancyCategory`: `A`, `B`, `C`, `D`, `X`, `N`, `UNKNOWN`, `REVIEW_REQUIRED`. Category `E` is rejected as a valid category and mapped to `REVIEW_REQUIRED`.

Allowed `lactationRiskLevel`: `COMPATIBLE`, `CAUTION`, `AVOID`, `INSUFFICIENT_DATA`, `UNKNOWN`, `REVIEW_REQUIRED`.

Forbidden fields include dosing, instructions, pricing, stock, pharmacy, trade-name, and brand-name fields. Imported rows default to `needs_review` even when the file says `reviewed`.
