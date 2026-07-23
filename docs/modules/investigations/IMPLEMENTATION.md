# Investigation Station v2

## Scope

`/investigations` is a database-backed Doctor workspace for direct patient orders and encounter-linked orders. The module uses the clinic's real patient, encounter, investigation, follow-up, permission, and audit services.

## Implemented workflow

- Active catalogue loaded from `InvestigationCatalogItem` records.
- Canonical top-level taxonomy:
  - Laboratory
  - Imaging
  - Pathology
  - Cardiac and Functional Tests
  - Procedures and Referrals
  - Other
- Expandable category accordion with database-derived subcategories.
- Search across names, codes, aliases, Arabic aliases, category, subcategory, modality, and sample type.
- Per-user Favorites.
- Personal reusable lists.
- Shared clinic templates in a separate Templates tab.
- Guidance-only entries separated from orderable templates.
- Recently used investigations derived from persisted orders.
- Multi-select and Add selected.
- Editable basket with remove and reorder controls.
- Session basket preservation.
- Encounter-scoped draft persistence.
- Direct Doctor/Owner patient ordering without creating a fabricated encounter.
- Encounter-embedded ordering without leaving the active visit.
- Patient search, change, clear, and open-file actions.
- Prior-order visibility beside catalogue items.
- Second confirmation for active duplicate requests or previous reviewed results.
- Result follow-up lifecycle with status counts and RBAC-protected transitions.
- Print paths for encounter-linked and standalone orders.
- Desktop `1 : 3 : 2` category/catalogue/basket proportions and responsive mobile layout.

## Expanded reference catalogue

The reference catalogue now contains more than 200 structured entries for practical OB/GYN clinic work. It intentionally avoids meaningless duplicated top-level departments.

### Laboratory

- Hematology
  - CBC and differential
  - Hemoglobin, hematocrit, RBC indices, WBC and platelet count
  - Blood film and reticulocytes
  - Blood group/Rh, type and screen, crossmatch, antibody testing
  - Iron studies, hemoglobin electrophoresis, sickling and G6PD
- Coagulation
  - Coagulation profile, PT/INR, aPTT, thrombin time
  - Fibrinogen and D-dimer
  - Mixing studies and anti-Xa
  - von Willebrand testing and factor assays
  - Protein C, Protein S, antithrombin and thrombophilia screen
- Clinical Chemistry
  - Glucose, HbA1c and separate OGTT time points
  - Liver and kidney functions
  - Electrolytes, calcium, magnesium and phosphate
  - Uric acid, inflammatory markers, lipids and vitamins
- Urine Analysis
  - Routine urinalysis and microscopy
  - Protein/creatinine and albumin/creatinine ratios
  - 24-hour urine protein, creatinine clearance and ketones
- Endocrinology and Reproductive Hormones
  - Thyroid, prolactin and hCG
  - FSH, LH, estradiol, progesterone and AMH
  - Androgen profile, SHBG, DHEA-S, 17-OHP, insulin and cortisol
- Serology and Immunology
  - Hepatitis B/C, HIV and syphilis testing
  - Rubella, toxoplasma, CMV, varicella and parvovirus
  - ANA, anti-dsDNA, ENA, complement and APS testing
  - Thyroid antibodies
- Microbiology
  - Urine, blood, vaginal, cervical, wound and placental cultures
  - High vaginal swab microscopy, wet mount and Gram stain
  - Chlamydia, gonorrhea and trichomonas NAAT
  - Group B streptococcus and genital fungal culture
- Andrology
  - Semen analysis, morphology, vitality and culture
  - Sperm DNA fragmentation
  - Antisperm antibodies and MAR testing
  - Post-ejaculatory urine assessment
- Tumor Markers
  - CA-125, HE4, ROMA panel, CEA, CA 19-9, CA 15-3
  - AFP, LDH, beta-hCG and inhibin markers
- Genetics and Prenatal Screening
  - NIPT, first-trimester and quadruple screening
  - Karyotype, products-of-conception karyotype and chromosomal microarray
  - Expanded carrier screening, CF, SMA and Fragile X
  - BRCA and Lynch syndrome panels
  - Hereditary thrombophilia testing
  - PGT-A, PGT-M and PGT-SR

### Imaging

- Gynecologic and fertility ultrasound
  - Pelvic, transvaginal, transabdominal, 3D/4D ultrasound
  - Pelvic color Doppler, sonohysterography and HyCoSy
  - Follicular monitoring and AFC
- Obstetric ultrasound and Doppler
  - Early pregnancy, dating, NT, anomaly and growth scans
  - Uterine artery, umbilical artery, MCA and ductus venosus Doppler
  - Biophysical profile, cervical length and placental assessment
  - Fetal medicine ultrasound and fetal MRI
- Breast imaging
  - Mammography, ultrasound and MRI
- General and vascular imaging
  - Abdominal, renal and thyroid ultrasound
  - Bilateral/right/left lower-limb venous duplex
  - Lower-limb arterial duplex
  - Pelvic venous, carotid and renal artery Doppler
  - CT abdomen/pelvis and CT pulmonary angiography
  - Chest/pelvic X-ray, HSG and DEXA

### Pathology

- Cervical cytology and liquid-based cytology
- HPV testing
- Endometrial, cervical, vulvar, placental, ovarian and breast histopathology
- Products-of-conception histopathology
- Ascitic fluid cytology
- Frozen section, immunohistochemistry and pathology review

### Cardiac and Functional Tests

- ECG, echocardiography, fetal echo and Holter monitoring
- Ambulatory blood pressure monitoring
- CTG and non-stress testing
- Spirometry and pulmonary function testing
- Urodynamic studies

### Procedures and Referrals

- Anesthesia and medical fitness assessment
- Cardiology, hematology, endocrinology, fetal medicine, breast, gynecologic oncology and vascular assessment
- Colposcopy, diagnostic hysteroscopy and endometrial sampling
- Pelvic-floor physiotherapy and clinical nutrition referrals

## Archive safety contract

Archiving is not deletion.

- Only Doctor or Owner roles can archive or restore through the dedicated backend controller.
- Archive is not placed next to the routine `+ Add` ordering action.
- The user must enter a reason.
- The user must type the exact investigation name.
- The final archive action stays disabled until both requirements are satisfied.
- Archived investigations disappear from active ordering views.
- Favorites and reusable-list links to the archived item are removed.
- Historical patient orders and results remain unchanged.
- Archive and restore events are audited.

## Catalogue governance

- New catalogue entries must use a canonical top-level category.
- Every seeded item requires a subcategory.
- Duplicate seed codes and duplicate normalized names fail validation.
- Critical OB/GYN, surgical, Doppler, coagulation, urine, microbiology, andrology, genetics, pathology and functional-test codes are required by the source-quality test.
- OGTT is explicitly validated under Clinical Chemistry, not Genetics.
- Source validation runs in CI before Prisma generation and database seeding.
- Existing database IDs are preserved through code-based upserts.
- No patient or operational demo records are introduced by the catalogue seed.

## Clinical safety contract

- Templates populate the editable basket only; they never submit automatically.
- Encounter orders require a permitted patient and active encounter.
- Standalone orders require Doctor or Owner authority and a permitted patient.
- No empty or fabricated encounter is created for direct orders.
- Doctor confirmation is required before persistence.
- Patient and encounter scope are enforced by the API.
- Database writes generate audit events.
- Result review remains restricted to authorized clinical roles.

## Acceptance gate

Before merge:

1. Catalogue source-quality validation passes.
2. Prisma migrations and reference seed complete on a clean database.
3. Typecheck and production build pass.
4. Security integration tests pass.
5. Direct-order persistence and audit tests pass.
6. Archive/restore RBAC and audit behavior is verified.
7. Desktop, mobile and Arabic/RTL layouts are manually approved.
8. Search, categories, favorites, lists, templates, custom catalogue entry, basket, draft restoration, direct ordering, encounter ordering, printing and follow-up are manually tested.
9. The module remains unmerged until explicit user approval.
