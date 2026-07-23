# Investigation Station v2 — Manual QA Checklist

Do not merge this module until the following checks are completed with authorized synthetic/QA patients only.

## Catalogue content

- [ ] Laboratory expands into Hematology, Coagulation, Clinical Chemistry, Urine Analysis, Endocrinology and Reproductive Hormones, Serology and Immunology, Microbiology, Andrology, Tumor Markers, and Genetics and Prenatal Screening.
- [ ] Search `PT`, `INR`, `aPTT`, `fibrinogen`, `D-dimer`, `von Willebrand`, `Protein S`, and `thrombophilia` returns the expected coagulation items.
- [ ] Search `urine analysis`, `تحليل بول`, `urine microscopy`, and `urine culture` returns the correct items.
- [ ] Urine culture appears under Microbiology, not Genetics or Clinical Chemistry.
- [ ] Search `semen`, `morphology`, `DNA fragmentation`, `antisperm`, and `MAR` returns Andrology items.
- [ ] Search `NIPT`, `karyotype`, `microarray`, `BRCA`, `Lynch`, `carrier screen`, and `PGT` returns Genetics and Prenatal Screening items.
- [ ] Search `OGTT` shows Clinical Chemistry and never Genetics.
- [ ] Search `CA-125`, `HE4`, `ROMA`, `CA 19-9`, `AFP`, and `inhibin` returns Tumor Marker items.
- [ ] Imaging expands into Gynecologic Ultrasound, Fertility Ultrasound, Obstetric Ultrasound, Obstetric Doppler, Breast Imaging, General Ultrasound, Vascular Ultrasound, MRI, CT, X-ray and Fluoroscopy, and Bone Densitometry.
- [ ] Search `Doppler`, `duplex`, `DVT`, `lower limb`, `MCA`, `umbilical`, `ductus venosus`, and `uterine artery` returns the correct imaging items.
- [ ] Bilateral, right, and left lower-limb venous duplex options are distinct.
- [ ] Pathology, Cardiac and Functional Tests, and Procedures and Referrals show clinically useful subcategories rather than duplicated top-level departments.

## Search and selection

- [ ] English name search works.
- [ ] Abbreviation search works.
- [ ] Stored alias search works.
- [ ] Arabic alias search works.
- [ ] Category and subcategory filtering work together.
- [ ] Multi-select and Add selected work.
- [ ] Favorite and unfavorite work and persist after reload.
- [ ] Recently used items are derived from real persisted orders.
- [ ] Prior-order information appears only after a patient is selected.

## Lists and templates

- [ ] A personal reusable list can be created from selected catalogue items.
- [ ] A personal list can be duplicated.
- [ ] A personal list can be archived.
- [ ] Shared actionable templates fill the basket but do not submit.
- [ ] Guidance-only entries do not create an orderable empty template.
- [ ] High-risk pregnancy template uses the normalized Obstetric Doppler code.

## Ordering

- [ ] Doctor can select a patient and place a direct order without creating an encounter.
- [ ] Owner can place a direct order without creating an encounter.
- [ ] Receptionist, Nurse, Accountant, and unauthorized Admin cannot use the standalone Doctor/Owner endpoint.
- [ ] Encounter-linked ordering remains locked to the active patient and encounter.
- [ ] Basket survives page navigation/session restoration as designed.
- [ ] Encounter basket draft persists to the database.
- [ ] Changing or clearing a patient with a populated basket requires confirmation.
- [ ] Active duplicate request triggers a second confirmation.
- [ ] Previous reviewed result triggers a second confirmation.
- [ ] Final order is saved to the selected patient.
- [ ] Print route matches direct or encounter-linked mode.

## Archive and restore

- [ ] Archive is absent from routine catalogue rows beside `+ Add`.
- [ ] Archive is available in catalogue management for Doctor and Owner only.
- [ ] The archive dialog explains that historical orders/results remain unchanged.
- [ ] Archive requires a reason of at least four characters.
- [ ] Archive requires typing the exact investigation name.
- [ ] The final archive button remains disabled until both conditions are met.
- [ ] Archived item disappears from active ordering views.
- [ ] Archived item is removed from Favorites.
- [ ] Archived item is removed from reusable lists.
- [ ] Historical orders/results remain visible and unchanged.
- [ ] Archived item appears in the Archived management filter.
- [ ] Restore returns it to active ordering views.
- [ ] Archive and restore actions appear in the audit log with the correct actor and item.
- [ ] Admin without Doctor/Owner role cannot call archive/restore directly.

## Follow-up

- [ ] Result received transition works for an authorized role.
- [ ] Doctor review transition works.
- [ ] Cancel/void requires a reason.
- [ ] Overdue/result-review tasks are created and closed correctly.
- [ ] Follow-up filters and counts update after a transition.

## Responsive and language review

- [ ] Desktop layout uses approximately `1 : 3 : 2` proportions.
- [ ] Category, catalogue, and basket panels scroll independently where intended.
- [ ] Basket remains usable at common laptop heights.
- [ ] Tablet layout remains readable.
- [ ] Mobile layout stacks without horizontal overflow.
- [ ] Arabic direction and labels are reviewed manually.
- [ ] Archive dialog works correctly in English and Arabic.

## Automated gate

- [ ] `node scripts/investigation-catalog-quality-test.mjs`
- [ ] Prisma migrations deploy successfully.
- [ ] Reference seed completes successfully.
- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] Core security integration passes.
- [ ] Route authorization passes.
- [ ] Referenced-record scope passes.
- [ ] Audit assertion suite passes.
- [ ] Direct patient investigation-order test passes.
