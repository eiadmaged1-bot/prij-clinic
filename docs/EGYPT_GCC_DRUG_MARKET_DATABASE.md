# Egypt GCC Drug Market Database

This document is the GCC-named entry point for the Egypt/Gulf drug-market database.

Target countries:
- EG: Egypt.
- KSA: Saudi Arabia.
- UAE: United Arab Emirates.
- QAT: Qatar.
- KWT: Kuwait.
- BHR: Bahrain.
- OMN: Oman.
- YEM: Yemen, optional regional extension.

The database stores marketed strength, form, route, and pack variants only. These fields must not be used as patient instructions, treatment plans, automatic dosing advice, or automatic prescriptions.

Official registry/API/file sources and licensed provider files are preferred. Retail public metadata is disabled by default, limited to product metadata if approved later, and must never override verified official registry data.

V0.7 status: the schema, seed registry, country list, badges, disabled connector placeholders, import review states, and demo reference products are present. A complete real Egypt/GCC medicine database has not been imported yet. Demo products are not market coverage.

Next import pack: Egypt plus Saudi Arabia official-source data, with all imported rows kept review-gated until verified.

See `docs/EGYPT_GULF_DRUG_MARKET_DATABASE.md`, `docs/DRUG_MARKET_COUNTRY_BADGES.md`, `docs/DRUG_MARKET_DATA_SOURCES.md`, and `docs/DRUG_MARKET_SOURCE_POLICY.md`.
