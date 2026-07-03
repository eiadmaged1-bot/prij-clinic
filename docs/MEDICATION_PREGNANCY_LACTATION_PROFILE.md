# Medication Pregnancy/Lactation Profile

Medication safety profiles attach to `MedicationGeneric`.

Legacy pregnancy category values:
- `A`
- `B`
- `C`
- `D`
- `X`
- `N`
- `UNKNOWN`
- `REVIEW_REQUIRED`

There is no category `E`. Imported `E` maps to `REVIEW_REQUIRED` with a review note.

Modern narrative fields:
- `pregnancyRiskSummary`
- `pregnancyClinicalConsiderations`
- `pregnancyDataSummary`
- `lactationRiskSummary`
- `lactationMilkTransferSummary`
- `lactationInfantEffectsSummary`
- `lactationClinicalConsiderations`
- `reproductivePotentialNotes`

Required metadata:
- `sourceName`
- `sourceType`
- `reviewStatus`
- `confidenceLevel`

`sourceUrl`, `sourceYear`, `reviewedByUserId`, and `reviewedAt` are optional.

Seeded generic medications receive empty `REVIEW_REQUIRED` profiles only. No real pregnancy or lactation safety claims are seeded.
