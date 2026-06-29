# Women's Health Protocol Atlas

The atlas is a local deterministic catalog for OB/GYN, reproductive medicine, breast health, pelvic floor, menopause, postpartum, sexual health, physiotherapy, and related women's health conditions.

It is not an autonomous diagnosis system. It only matches doctor-entered diagnosis/problem text to local protocol records.

## Statuses

- `verified`: may generate a short management snapshot for doctor review.
- `draft`: visible to authorized clinical users, but generates no management options.
- `catalog_only`: listed for coverage, but generates no management options.
- `retired`: hidden from normal clinical search.

Initial verified protocols:

- `ENDOMETRIOSIS_MANAGEMENT_V1`
- `PCOS_OVULATION_INDUCTION_V1`
- `UNEXPLAINED_INFERTILITY_V1`

All other seeded protocols are catalog-only unless later verified by Owner/Admin.

## Safety

- No external AI calls.
- No automatic diagnosis.
- No automatic prescribing.
- No medication dose automation.
- No signed record modification.
- Doctor approval is required before use in care.
- Catalog-only and draft protocols never generate treatment advice.

## Adding A Condition

Add a `ClinicalProtocol` seed or admin-created record with a unique code, group, aliases, source metadata, status, short content JSON, and safety JSON.

Use original summaries only. Do not paste long guideline text.
