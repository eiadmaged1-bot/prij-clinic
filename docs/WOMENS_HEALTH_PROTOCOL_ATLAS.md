# Women's Health Protocol Atlas

The atlas is a local deterministic catalog for OB/GYN, reproductive medicine, breast health, pelvic floor, menopause, postpartum, sexual health, physiotherapy, and related women's health conditions.

It is not an autonomous diagnosis system. It only matches doctor-entered diagnosis/problem text to local protocol records.

## Statuses

- `catalog_only`: listed for coverage, but generates no management options.
- `draft`: under Owner/Admin verification, but generates no management options.
- `verified`: may generate a short management snapshot for doctor review.
- `retired`: hidden from normal clinical search and generates no management options.

Initial verified protocols:

- `ENDOMETRIOSIS_MANAGEMENT_V1`
- `PCOS_OVULATION_INDUCTION_V1`
- `UNEXPLAINED_INFERTILITY_V1`

All other seeded protocols remain catalog-only unless later verified by Owner/Admin.

## Browser Behavior

The `/protocol-atlas` page supports group, status, risk level, and verified-only filters. It shows counts for total, verified, draft, catalog-only, and retired matches.

Catalog-only cards state that the protocol is listed in the atlas but the management snapshot is not verified yet. Verified cards show that a snapshot is available for doctor review and display source metadata.

## Structured Content Shape

Verified content is stored as structured sections:

- summary
- goals
- management options
- safety checks
- contraindication checks
- red flags
- follow-up considerations
- referral considerations
- limitations

Management options are capped at five. Safety checks are capped at eight. Medication dose patterns, prescribing commands, definitive diagnosis language, guaranteed outcome language, and unsafe finality words are rejected.

## Safety

- No external AI calls.
- No automatic diagnosis.
- No automatic prescribing.
- No medication dose automation.
- No signed record modification.
- Doctor approval is required before use in care.
- Catalog-only, draft, retired, and unknown protocols never generate management advice.
- Verified output remains draft support only until reviewed by a doctor.

## Current Limit

The atlas is a protocol coverage and verification framework. It does not include hundreds of complete verified clinical management protocols yet.
# V0.5 Verified Packs

Clean seed counts after this sprint:
- Verified protocols before pack work: 3.
- Verified protocols after all four packs: 73.
- Catalog-only protocols after all four packs: 299.

Added verified packs:
- Emergency OB and early pregnancy red flags: 20 protocols.
- AUB and menstrual disorders: 17 protocols.
- Contraception eligibility and counseling: 17 protocols.
- Routine antenatal care: 16 protocols.

Structured content validation enforces doctor-review support, limitations, source metadata, short option/check counts, and unsafe-wording guards.
