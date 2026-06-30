# Reference Data Bootstrap

Reference data is bootstrapped through `npm run seed:reference`, which runs clean seed mode.

Included reference/setup domains:

- Guideline source registry.
- Women's health Protocol Atlas.
- Medication family taxonomy and source registry.
- Drug-market countries, official sources, and connector placeholders for Egypt/Gulf coverage.
- Herbal/supplement source placeholders.

Reference data is not patient advice. Medication strength, form, package, country availability, and source metadata are catalog fields only and must never be treated as patient directions.

Helper scripts are placeholders that do not fetch external data automatically:

- `npm run reference:import:medications`
- `npm run reference:import:herbs`
- `npm run reference:import:drug-market`
- `npm run reference:guidelines:sources`
