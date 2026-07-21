# Investigation Station v1

## Scope

This module rebuilds `/investigations` as a database-backed Doctor workspace using the approved standalone HTML workflow as a functional reference.

## Implemented behavior

- Active investigation catalogue loaded from `InvestigationCatalogItem` records.
- Expandable and collapsible category accordion using `+` and `−` controls.
- Nested database-derived subcategories.
- Search across investigation name, code, category, subcategory, modality, sample type, and stored aliases.
- Per-user database favorites.
- Personal reusable investigation lists stored as `InvestigationFavoriteSet` records.
- Shared clinic templates loaded from active clinic-scoped sets.
- Recently used investigations derived from persisted investigation orders.
- Editable basket with add, remove, and reorder controls.
- Encounter-scoped draft autosave through `InvestigationOrderDraft`.
- Real clinical request creation linked to patient and active encounter.
- Second confirmation when an active duplicate order or a prior reviewed result is detected.
- Database-backed result follow-up lifecycle with RBAC and audit logging.
- Responsive desktop/mobile layout and English/Arabic copy.

## Starter reference catalogue

The reference seed contains active structured items under:

- Laboratory
  - Hematology
  - Biochemistry
  - Urine Analysis
  - Hormones
  - Serology
  - Microbiology
  - Andrology
  - Immunology
  - Tumor Markers
- Ultrasound
  - Gynecology
  - Infertility
  - Obstetric
- Radiology
  - Breast Imaging
  - Cross-sectional Imaging
  - Plain Radiography
  - Fluoroscopy
- Pathology
  - Cytology
  - Histopathology
- Cardiology
- Other

Catalogue records include practical aliases, including selected Arabic search aliases. No patient or operational demo records are introduced by this module.

## Safety contract

- Templates fill the editable basket only and never create an order automatically.
- A real order requires a permitted patient and active encounter.
- Doctor confirmation is required before persistence.
- Patient and encounter scope are enforced by the API.
- Database writes generate existing investigation audit events.
- Result review remains restricted to authorized clinical roles.

## Acceptance gate

Before merge:

1. CI typecheck and production build pass.
2. Security integration tests pass.
3. Catalogue seed completes against a clean migrated database.
4. Desktop and mobile layouts are visually approved.
5. Accordion, search, favorites, lists, basket, draft restoration, order creation, and follow-up are manually tested with authorized accounts.
6. The module remains unmerged until explicit approval.
