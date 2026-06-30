# Official Medication Verification Batch 2 - Oman

Date: 2026-06-30

Scope: market/reference medication metadata only. Strength, form, pack, and official/source price are not patient dosing instructions. No pharmacy stock, order, cart, checkout, purchase, prescribing, treatment plan, or external AI workflow was added.

## Results

- Total real official rows: 8,269.
- Bahrain NHRA imported rows: 3,169.
- Bahrain verified rows preserved: 100.
- Oman MOH imported rows: 5,100.
- Oman verified rows before batch 2: 0.
- Oman verified rows after batch 2: 100.
- Demo rows excluded from real counts/search by default: 23.
- Open official review items after batch 2: 8,069 total.
- Oman open review items after batch 2: 5,000.

## Oman Parser Confidence

Before this sprint, Oman rows were all low confidence because structured strength and dosage form were missing:

- `>= 0.90`: 0
- `>= 0.80`: 0
- `>= 0.70`: 0
- `>= 0.60`: 0
- `< 0.60`: 5,100

After parser batch 2:

- `>= 0.90`: 3,507
- `>= 0.80`: 3,833
- `>= 0.70`: 4,883
- `>= 0.60`: 5,041
- `< 0.60`: 59

Extracted structured Oman fields after batch 2:

- Trade name: 5,100.
- Generic/scientific name: 3,861.
- Strength text: 4,634.
- Dosage form: 4,898.
- Pack/package: 3,871.
- Manufacturer/company: 2,833.
- Registration number: 5,100.
- Official/source price with OMR currency: 5,100.
- Official raw row JSON: 5,100.

High-confidence Oman candidates before verification: 5,029. Batch 2 verified 100 rows with reason `Official Oman MOH high-confidence batch review`. Low-confidence rows and duplicate-risk rows stayed blocked from batch verification.

## Source Metadata

- Source: `OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES`.
- Source file label: `oman-moh-registered-pharmaceutical-products-with-prices-2026-06-30-ae9e43c25154.pdf`.
- Source file SHA-256: `ae9e43c25154587b8acbf62073c6b42760477dfc3b9455c95bb4a952a52e73e4`.
- Source freshness: current checked today.
- Source snapshots/import metadata preserved.
- Raw official PDF was not committed.

## Remaining Review Reasons

Review queue reasons remain specific for unverified rows:

- missing generic/scientific name
- missing strength
- missing dosage form
- low parser confidence
- duplicate risk
- missing source metadata or official row JSON if ever encountered

## Other Source Diagnostics

- Qatar MOPH: official pages returned HTML and did not expose a supported visible XLSX/source-file link; no rows were faked.
- Kuwait MOH: official PDF fetch failed safely; no rows were faked.
- Saudi SFDA: public page did not expose a parseable server-rendered table for the dry run; approved connector or official/manual file remains required.
- Egypt EDA: official file upload plus targeted lookup only; no bulk enumeration or bypass.

## Verification Commands

```powershell
npm run medication:oman:parser:audit
npm run medication:oman:qa
npm run medication:oman:review:summary
npm run medication:oman:verify:batch -- --limit 100 --reason "Official Oman MOH high-confidence batch review"
npm run medication:validate:official
npm run medication:coverage:report
npm run medication:review:summary
```

## Next Options

1. Qatar/Kuwait/SFDA official source recovery.
2. Egypt official EDA file ingestion if the owner provides the file.
3. Medication verification batch 3.
