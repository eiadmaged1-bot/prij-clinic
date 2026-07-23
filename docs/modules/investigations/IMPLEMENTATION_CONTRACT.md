# Investigation Station v2 — Implementation Contract

## Functional scope

- Database-backed Doctor workspace at `/investigations`.
- Direct patient ordering without creating a fabricated encounter.
- Encounter-linked ordering embedded inside the active visit.
- Live patient search, clear/change selection, open patient file, and guarded patient switching.
- Desktop category : catalogue : basket proportions of approximately `1 : 3 : 2`.
- Independent scrolling with a sticky basket where appropriate.
- Separate Library, My Lists, Favorites, Recent, Results Follow-up, and Templates views.
- Multi-select, Add selected, favorites, recent items, prior-order visibility, basket reordering, draft restoration, and mode-correct printing.
- Doctor/Owner archive and restore workflow without deletion.

## Catalogue contract

Canonical top-level departments are limited to:

1. Laboratory
2. Imaging
3. Pathology
4. Cardiac and Functional Tests
5. Procedures and Referrals
6. Other

Clinical contexts such as antenatal care, infertility, abnormal uterine bleeding, oncology, menopause, and preoperative review are tags/templates rather than duplicate medical departments.

The catalogue must include practical coverage for:

- Hematology and surgical blood preparation
- Extended coagulation and thrombophilia testing
- Clinical chemistry and OGTT time points
- Urinalysis and microbiology
- Reproductive hormones and immunology
- Andrology
- Tumor markers
- Genetics, carrier screening, prenatal screening and PGT
- Gynecologic, fertility and obstetric ultrasound
- Obstetric Doppler
- Lower-limb and other vascular duplex studies
- Breast/general imaging, MRI, CT, X-ray, HSG and DEXA
- Cytology, histopathology and molecular pathology
- Fetal surveillance, cardiac, pulmonary and urodynamic tests
- Clinically relevant procedures and specialist referrals

Every seeded record must have a stable unique code, unique normalized name, canonical category, non-empty subcategory, practical aliases, modality/sample type where applicable, and active status.

## Archive contract

- Archive is not delete.
- Only Doctor or Owner may archive or restore.
- Backend authorization is mandatory.
- Archive must not be a one-click action beside routine ordering controls.
- A reason is required.
- Exact-name confirmation is required.
- Historical patient orders and results are preserved.
- Archived items disappear from active ordering views.
- Favorite and reusable-list references are removed.
- Restore is supported.
- Archive and restore are audited.

## Ordering safety contract

- Templates fill the editable basket only and never submit automatically.
- Encounter orders require an authorized locked patient and encounter.
- Standalone orders require an authorized patient and Doctor or Owner authority.
- No empty encounter is created for direct orders.
- Doctor confirmation is required before persistence.
- Patient and encounter scope are enforced by the API.
- Active duplicates and previous reviewed results trigger another confirmation.
- Database writes generate audit events.
- Result review remains permission-scoped.

## Acceptance gate

Before merge:

1. Source-quality test validates the catalogue structure and critical codes.
2. Clean migrations and reference seed complete.
3. Typecheck and production build pass.
4. Security, route authorization, record scope and audit suites pass.
5. Direct patient order persistence and audit test passes.
6. Archive/restore RBAC and audit behavior is verified.
7. Desktop, mobile and Arabic/RTL workflows are manually approved.
8. Explicit user approval is received.

The module remains unmerged until the acceptance gate is complete.
