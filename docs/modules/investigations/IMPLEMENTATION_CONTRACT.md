# Investigation Station v1

## Scope

This module rebuilds `/investigations` as a database-backed Doctor workspace using the approved standalone HTML workflow as a functional reference and the clinic's real investigation services.

## Implemented behavior

- Active investigation catalogue loaded from `InvestigationCatalogItem` records.
- Canonical medical taxonomy enforced at the API boundary.
- Expandable and collapsible category accordion using `+` and `−` controls.
- Nested database-derived subcategories.
- Search across investigation name, code, category, subcategory, modality, sample type, stored aliases, and selected Arabic terms.
- Per-user database favorites.
- Personal reusable investigation lists stored as `InvestigationFavoriteSet` records.
- Shared actionable clinic templates in a dedicated Templates tab.
- Guidance-only zero-item entries separated from orderable templates.
- Recently used investigations derived from persisted investigation orders.
- Editable basket with add, multi-select, remove, and reorder controls.
- Encounter-scoped draft autosave through `InvestigationOrderDraft`.
- Encounter-embedded ordering without leaving the active visit.
- Direct Doctor/Owner patient ordering without fabricating an encounter.
- Patient search, change, clear, and open-file controls in Investigation Station.
- Guarded patient changes when the basket contains investigations.
- Real investigation request/order creation linked to the selected patient.
- Prior-order/result visibility beside catalogue investigations.
- Second confirmation when an active duplicate order or a prior reviewed result is detected.
- Database-backed result follow-up lifecycle with RBAC and audit logging.
- Correct print routes for encounter-linked requests and standalone orders.
- Desktop `1 : 3 : 2` category/catalogue/basket layout and responsive mobile layout.

## Canonical catalogue departments

- Laboratory
  - Hematology
  - Coagulation
  - Clinical Chemistry
  - Endocrinology and Reproductive Hormones
  - Urine Analysis
  - Microbiology
  - Serology and Immunology
  - Tumor Markers
  - Genetics and Prenatal Screening
  - Andrology
- Imaging
  - Obstetric Ultrasound
  - Gynecologic Ultrasound
  - Fertility Ultrasound
  - Breast Imaging
  - MRI
  - CT
  - X-ray and Fluoroscopy
- Pathology
  - Cytology
  - Histopathology
  - Molecular Pathology
- Cardiac and Functional Tests
- Procedures and Referrals
- Other

Clinical contexts such as antenatal care, infertility, AUB, oncology, menopause, and preoperative review remain searchable tags/templates rather than duplicate medical departments.

## Safety contract

- Templates fill the editable basket only and never create an order automatically.
- Encounter orders require an authorized locked patient and encounter.
- Standalone orders require an authorized patient plus Doctor or Owner authority.
- Standalone ordering never creates an empty or fabricated encounter.
- Doctor confirmation is required before persistence.
- Patient and encounter scope are enforced by the API.
- Database writes generate investigation audit events.
- Result review remains restricted to authorized clinical roles.
- Patient changes with a populated basket require explicit confirmation.

## Acceptance gate

Before merge:

1. CI typecheck and production build pass.
2. Security integration tests pass.
3. Catalogue seed completes against a clean migrated database.
4. Active catalogue records use only canonical categories and populated subcategories.
5. Direct patient order persistence and audit tests pass.
6. Desktop and mobile layouts are visually approved.
7. Accordion, search, favorites, lists, templates, basket, draft restoration, direct ordering, encounter ordering, printing, and follow-up are manually tested with authorized accounts.
8. The module remains unmerged until explicit approval.
