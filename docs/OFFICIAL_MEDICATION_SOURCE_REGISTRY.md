# Official Medication Source Registry

This registry tracks approved or candidate medication reference sources for v0.10.0 official re-import work. It is not a medication database and does not contain medication rows.

Medication strength, form, and pack fields are market/reference metadata only. They must never become patient directions, dosing instructions, frequency, duration, or auto-prescribing behavior.

| Source | Country | Historical status | Target row count from project history | Import status now | Data type | Verification policy |
| --- | --- | --- | ---: | --- | --- | --- |
| Bahrain NHRA | BH | Previously imported | 3,169 | Needs re-import | Official medication registry/reference data | Imported rows default to `needs_review` unless prior project `verificationStatus=verified` is explicitly present in the source file. |
| Oman MOH | OM | Previously imported | 5,100 | Needs re-import | Official medication registry/reference data | Imported rows default to `needs_review` unless prior project `verificationStatus=verified` is explicitly present in the source file. |
| Egypt EDA | EG | Future source/mapping | TBD | Future source/mapping | Official registry/reference data only after an official downloadable or owner-approved source is identified | Do not implement bulk import until an official downloadable source or owner-approved file is identified. |
| Saudi SFDA | KSA | Future source/mapping | TBD | Future source/mapping | Official registry/reference data | Imported rows must default to `needs_review` until source-specific verification policy is approved. |
| UAE MOHAP/EDE | UAE | Future source/mapping | TBD | Future source/mapping | Official registry/reference data | Imported rows must default to `needs_review` until source-specific verification policy is approved. |
| Yemen | YEM | Future owner-provided official file likely required | TBD | Future owner-provided official file likely required | Official registry/reference data | Imported rows must default to `needs_review`; no public-source assumptions. |

## Current v0.10.0 Status

- Earlier project work recorded 8,269 real official Bahrain/Oman rows and 1,200 verified official rows, but v0.9.7-v0.9.9 found no committed raw export, recoverable old DB, or local official rows in the current workspace.
- v0.10.0 rebuilds the import framework from public official or owner-approved source files only.
- No fake rows, AI-generated medication lists, retail stock/order/cart/checkout pages, patient dosing instructions, or auto-prescribing behavior are allowed.
- Prescription medication selection must remain blocked from strict readiness claims until official rows are acquired and imported.
