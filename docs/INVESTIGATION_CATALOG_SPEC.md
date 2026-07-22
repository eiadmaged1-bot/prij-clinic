# Prij Clinic Investigation Catalogue Specification

**Version:** 1.0  
**Status:** Approved content baseline; implementation requires explicit user command.  
**Purpose:** Authoritative source for Investigation Station catalogue normalization, shared clinic templates, standalone ordering, and encounter ordering.

## How Antigravity must use this file

- Treat this file as the source of truth.
- Do not recreate the catalogue from memory.
- Do not add unapproved investigations or template items.
- Do not duplicate visible items when aliases represent the same clinical investigation.
- Preserve historical orders and results by archive/remap logic, never destructive deletion.
- Both standalone and encounter ordering must use the same canonical IDs and API source.
- Templates fill an editable basket and never submit automatically.

---

FINAL TOP-LEVEL CATEGORIES
Use exactly:
1. Laboratory
2. Imaging
3. Cardiac and Functional Testing
4. Pathology and Molecular Diagnostics
5. Diagnostic Procedures
6. Specialist Referrals and Clearance

Do not show the previous old top-level categories after migration.
Do not keep duplicate visible entries.
Preserve historical data by archiving/remapping rather than destructive deletion.

CANONICALIZATION RULES
One clinical investigation equals one visible canonical item.
Aliases help search but must not create extra visible cards.

Required examples:
- Complete blood count (CBC)
  aliases: CBC, Complete Blood Count, Complete Blood Picture, CBP, FBC, Full Blood Count
  Do not expose Hemoglobin, Hematocrit, RBC count, WBC count, or Platelet count as routine standalone catalogue cards when they are ordinary CBC components.

- Cervical cytology / Pap smear
  aliases: Pap smear, Pap test, cervical smear, Pap smear cytology, cervical cytology
  One visible item only.

- Pelvic MRI
  aliases: MRI pelvis, pelvis MRI, pelvic magnetic resonance imaging
  One visible item only.

- Saline infusion sonohysterography (SIS)
  aliases: saline infusion sonography, SIS, sonohysterography, hysterosonography
  One visible item only.

- Uterine artery Doppler
  alias: uterine Doppler
  Do not create a second duplicate under vascular Doppler.

- Office endometrial biopsy / sampling
  aliases: office endometrial sampling, endometrial biopsy procedure, Pipelle biopsy, Pipelle sampling
  One diagnostic procedure only.
  Keep “Endometrial biopsy histopathology” as a separate pathology order.

- Quantitative serum beta-hCG
  One laboratory item only.
  “Tumor marker” must be stored as a clinical indication, not a duplicated test.

- Coagulation profile
  Must resolve to PT, INR, and aPTT without creating duplicate basket entries.
  PT, INR, and aPTT appear once each in the catalogue.

- TORCH panel and thrombophilia screen
  Treat as restricted editable templates, not ordinary single tests.
  Never submit automatically.

VISIBLE CARD DESIGN
Normal result card must be compact:
Investigation name
Subcategory · specimen/modality
[Favorite] [+ Add]

Do not place long aliases, warnings, repeated categories, or helper paragraphs on every card.
Show clinical notes only in a small details panel when relevant.
Strengthen card/input/search borders for better visibility and reduced eye strain.

NORMAL ORDER WORKFLOW
Default doctor workflow:
1. Title: Investigation order
2. Search patient by name or phone
3. Selected patient context
4. Catalogue / Favorites / Recent / My Lists / Templates
5. Selected items
6. One overall Order note field
7. Submit order

Remove from normal default workflow:
- Priority
- Internal/external
- Destination
- Follow-up owner
- Expected result date
- More options
- Review-and-submit helper wording
- Library mode
- Standalone draft
- MRN or QR wording inside the search placeholder

Search placeholder:
Search patient by name or phone

Create List must remain a separate secondary mode.
List-name fields must never appear during routine patient ordering.

SHARED FUNCTIONALITY
Standalone and encounter investigation builders must share:
- same catalogue data
- same six categories
- same search
- same favorites
- same recent items
- same My Lists
- same shared Clinic Templates
- same compact cards
- same basket rules
- same aliases
- same canonical IDs

Encounter ordering must preserve encounterId.
Standalone ordering must preserve encounterId = null.
Both must appear immediately in the patient-file Investigations tab.

DATA MIGRATION RULES
1. Preserve all historical investigation orders and results.
2. Archive obsolete and duplicated catalogue entries instead of hard deletion.
3. Create canonical entries with stable codes.
4. Move old names into aliases.
5. Remap favorites to canonical IDs.
6. Remap personal lists to canonical IDs.
7. Remap shared templates to canonical IDs.
8. Prevent archived duplicates from returning after reseed.
9. Never silently reactivate archived items.
10. Keep audit history.
11. Add a migration/report showing:
   - canonical item created
   - legacy items archived
   - favorites remapped
   - list items remapped
   - template items remapped
   - unresolved legacy references
AUTHORITATIVE CATALOGUE

1) LABORATORY

A. Andrology
- Semen analysis
- Sperm DNA fragmentation
- Semen culture and sensitivity
- Antisperm antibodies
- Post-ejaculatory urine analysis

B. Clinical Chemistry

Glucose and Metabolic Tests
- Fasting blood glucose
- Random blood glucose
- 2-hour postprandial blood glucose
- 50-g glucose challenge test
- Oral glucose tolerance test (OGTT)
- HbA1c
- Fasting insulin
- Lipid profile

Renal Function and Electrolytes
- Urea
- Creatinine
- Uric acid
- Sodium
- Potassium
- Total calcium
- Ionized calcium
- Magnesium
- Phosphorus

Liver Function and Proteins
- Total protein
- Albumin
- Total and direct bilirubin
- AST
- ALT
- ALP
- GGT
- LDH
- Serum bile acids

Iron Studies
- Ferritin
- Serum iron
- TIBC

Inflammatory Markers
- CRP
- ESR

Vitamins
- Vitamin B12
- Folate
- Vitamin D

Pancreatic Enzymes
- Amylase
- Lipase

C. Coagulation and Thrombophilia

Routine Coagulation
- Coagulation profile
- PT
- INR
- aPTT
- Fibrinogen
- D-dimer

Thrombophilia Testing
- Lupus anticoagulant
- Anticardiolipin antibodies IgG/IgM
- Beta-2 glycoprotein I antibodies IgG/IgM
- Protein C
- Protein S
- Antithrombin III
- Factor V Leiden mutation
- Prothrombin G20210A mutation
- von Willebrand factor testing

Restricted editable template:
- Thrombophilia screen

D. Endocrinology and Reproductive Hormones

Reproductive Hormones
- FSH
- LH
- Prolactin
- Estradiol (E2)
- Progesterone
- Total testosterone
- Free testosterone
- DHEA-S
- SHBG
- AMH

Thyroid Testing
- TSH
- Free T4
- Free T3
- Thyroid peroxidase antibodies
- Thyroglobulin antibodies

Adrenal Hormones
- Cortisol
- ACTH
- 17-OH progesterone

Pregnancy Hormone
- Quantitative serum beta-hCG

E. Genetics and Prenatal Screening
- Karyotype
- Non-invasive prenatal testing (NIPT)
- First-trimester combined screening
- Second-trimester maternal serum screening
- Carrier screening panel

F. Hematology and Immunohematology

Hematology
- Complete blood count (CBC)
- Peripheral blood film
- Reticulocyte count
- G6PD assay
- Hemoglobin electrophoresis

Blood Group and Immunohematology
- ABO blood group and Rh typing
- Indirect antiglobulin test / Indirect Coombs test
- Direct antiglobulin test / Direct Coombs test

G. Microbiology

Urine and Blood
- Urine culture and sensitivity
- Blood culture

Genital Tract and Obstetric Microbiology
- Vaginal swab culture and sensitivity
- High vaginal swab for microscopy, culture and sensitivity
- Endocervical swab
- Urethral swab
- Group B streptococcus screen
- Chlamydia NAAT
- Gonorrhea NAAT
- Trichomonas testing
- Vaginal wet mount and microscopy
- Vaginal fungal culture
- Bacterial vaginosis testing
- HSV lesion PCR or swab

Other Cultures
- Wound swab culture and sensitivity
- Stool culture

H. Serology and Immunology

Infectious Disease Screening
- HIV-1/2 antigen and antibody test
- HBsAg
- HCV antibody
- VDRL / RPR

Pregnancy-Related Serology
- Rubella IgG
- Rubella IgM
- Toxoplasma IgG
- Toxoplasma IgM
- CMV IgG
- CMV IgM
- Parvovirus B19 IgG/IgM
- Type-specific HSV-1/HSV-2 IgG

Restricted editable template:
- TORCH panel

Clinical-note metadata:
- IgM tests display concise “when clinically indicated / acute infection suspected” notes.
- Do not place the long warning in the card title.

Autoimmune Testing
- ANA
- Anti-dsDNA
- Rheumatoid factor

I. Tumor Markers
- CA-125
- CA 19-9
- CEA
- AFP
- HE4

Do not create a duplicate beta-hCG tumor marker test.
Use Quantitative serum beta-hCG with the clinical indication “Tumor marker assessment”.

J. Urine and Stool Analysis

Urine Testing
- Routine urine analysis
- Urine microscopy
- Urine protein/creatinine ratio
- 24-hour urinary protein
- Urine ketones

Stool Testing
- Stool analysis
- Fecal occult blood test


2) IMAGING

A. Gynecologic Ultrasound
- Pelvic ultrasound
- Transabdominal pelvic ultrasound
- Transvaginal ultrasound
- 3D pelvic ultrasound
- Saline infusion sonohysterography (SIS)

B. Obstetric Ultrasound
- First-trimester obstetric ultrasound
- Early pregnancy viability scan
- Early fetal anatomy scan
- Nuchal translucency scan
- Second-trimester anomaly scan
- Detailed fetal anomaly scan
- Third-trimester growth scan
- Multiple-pregnancy growth surveillance
- Biophysical profile
- Fetal well-being scan
- Estimated fetal weight scan
- Placental localization scan
- Cervical length ultrasound

C. Obstetric Doppler
- Obstetric Doppler ultrasound
- Uterine artery Doppler
- Umbilical artery Doppler
- Middle cerebral artery Doppler
- Ductus venosus Doppler
- Multiple-pregnancy Doppler surveillance

D. Fertility Ultrasound
- Folliculometry / ovulation tracking
- Antral follicle count
- Endometrial monitoring ultrasound

E. Breast Imaging
- Breast ultrasound
- Screening mammography
- Diagnostic mammography
- Breast MRI

F. General Ultrasound
- Abdominal ultrasound
- Renal tract ultrasound
- Thyroid ultrasound
- Soft-tissue ultrasound

G. Duplex and Vascular Doppler
- Lower-limb venous duplex / DVT scan
- Lower-limb arterial duplex
- Pelvic vascular Doppler
- Ovarian Doppler
- Carotid duplex

Do not duplicate Uterine artery Doppler here.

H. X-ray and Fluoroscopy
- Chest X-ray
- Abdominal X-ray
- Hysterosalpingography (HSG)

I. CT Imaging
- CT brain
- CT chest
- CT abdomen and pelvis
- CT pulmonary angiography

J. MRI
- Pelvic MRI
- Abdominal MRI
- MRI brain
- Pituitary MRI
- MR venography

K. Bone Health Imaging
- Bone mineral density scan / DEXA


3) CARDIAC AND FUNCTIONAL TESTING

A. Cardiac Testing
- Electrocardiogram (ECG)
- Echocardiography
- Fetal echocardiography
- Cardiotocography / Non-stress test (CTG / NST)
- Holter monitoring
- Ambulatory blood pressure monitoring

B. Pulmonary and Functional Testing
- Spirometry
- Full pulmonary function test


4) PATHOLOGY AND MOLECULAR DIAGNOSTICS

A. Cytology
- Cervical cytology / Pap smear
- Endometrial cytology

B. Histopathology
- Endometrial biopsy histopathology
- Cervical biopsy histopathology
- Endocervical curettage histopathology
- Vulvar biopsy histopathology
- Vaginal biopsy histopathology
- Endometrial polyp histopathology
- Cervical polyp histopathology
- Uterine leiomyoma / myoma histopathology
- Ovarian cyst histopathology
- Fallopian tube histopathology
- Products of conception histopathology
- Placental histopathology

C. HPV and Molecular Testing
- HPV DNA test
- HPV typing


5) DIAGNOSTIC PROCEDURES

A. Gynecologic Diagnostic Procedures
- Colposcopy
- Diagnostic hysteroscopy
- Office endometrial biopsy / sampling
- Cervical punch biopsy
- Vulvar punch biopsy

B. Image-Guided Procedures
- Ultrasound-guided biopsy

Clinical rule:
The diagnostic procedure records how the specimen was obtained.
The corresponding pathology order records how the specimen is examined.


6) SPECIALIST REFERRALS AND CLEARANCE

A. Obstetric and Fertility Referrals
- Maternal-fetal medicine review
- Reproductive medicine / infertility review
- Fertility procedure referral
- IVF / ICSI referral
- Genetic counseling referral
- Carrier screening counseling or referral
- Neonatology review

B. Medical Specialist Review
- Internal medicine review
- Endocrinology review
- Hematology review
- Rheumatology review
- Nephrology review
- Neurology review
- Infectious disease review
- Gastroenterology / hepatology review
- Chest physician / pulmonology review
- Cardiology review

C. Surgical and Oncology Review
- Oncology review
- Breast surgeon review
- General surgery review
- Vascular surgery review
- Urology review

D. Supportive Care Referrals
- Dietitian review
- Psychiatry or psychology review
- Pelvic-floor physiotherapy referral

E. Preoperative Assessment and Clearance
- Anesthesia assessment
- Cardiology clearance
- Preoperative assessment and fitness for surgery
SHARED CLINIC TEMPLATES
Implement these as shared, governed Clinic Templates visible under Templates.
They are not ordinary personal lists.
Doctors may clone them into My Lists.
Templates fill an editable preview/basket and never submit automatically.

Template card actions:
- Select template
- Preview
- Clone to My Lists

Applying a template:
- Show core items.
- Show optional/conditional items.
- Show alternatives.
- Allow deselection.
- Replace basket after confirmation by default.
- Offer Add missing items.
- Never create duplicates.
- Never submit automatically.

TEMPLATE 1
Group: Antenatal Care (ANC)
Name: First-Trimester Booking Panel
Description: Essential baseline for a new obstetric patient.

Core:
- Complete blood count (CBC)
- ABO blood group and Rh typing
- Routine urine analysis
- HBsAg
- HCV antibody
- HIV-1/2 antigen and antibody test
- VDRL / RPR
- Rubella IgG

Alternative group — choose one:
- Random blood glucose
- Fasting blood glucose

Alternative group — choose one:
- First-trimester obstetric ultrasound
- Early pregnancy viability scan


TEMPLATE 2
Group: Antenatal Care (ANC)
Name: PIH / Pre-Eclampsia Workup
Description: Evaluation of new-onset hypertension during the second or third trimester.

Core maternal:
- Complete blood count (CBC)
- Urea
- Creatinine
- Uric acid
- AST
- ALT
- LDH

Alternative protein assessment — default first item:
- Urine protein/creatinine ratio
- 24-hour urinary protein

Editable fetal assessment subgroup:
- Fetal well-being scan
- Biophysical profile
- Umbilical artery Doppler
- Middle cerebral artery Doppler
- Cardiotocography / Non-stress test (CTG / NST)


TEMPLATE 3
Group: Fertility and Reproductive Endocrinology
Name: Basic Infertility Workup (Female)
Description: Initial diagnostic baseline for a new fertility consultation.

Items:
- AMH
- FSH
- LH
- Estradiol (E2)
- Prolactin
- TSH
- Rubella IgG
- Transvaginal ultrasound
- Antral follicle count
- Hysterosalpingography (HSG)

Timing metadata:
- FSH, LH and Estradiol: cycle day 2 or 3.
- HSG: cycle-timed after pregnancy exclusion.
- Antral follicle count: normally early cycle.


TEMPLATE 4
Group: Fertility and Reproductive Endocrinology
Name: PCOS / Hyperandrogenism Panel
Description: Evaluation of oligomenorrhea, hirsutism or suspected PCOS.

Core:
- Total testosterone
- Free testosterone
- SHBG
- FSH
- LH
- Fasting insulin
- Lipid profile
- Transvaginal ultrasound

Alternative glucose assessment — choose one:
- Fasting blood glucose
- Oral glucose tolerance test (OGTT)

Do not add optional items not approved by the user.


TEMPLATE 5
Group: Fertility and Reproductive Endocrinology
Name: Recurrent Pregnancy Loss (RPL) Screen
Description: Evaluation after two or more consecutive clinical pregnancy losses.

Antiphospholipid antibody assessment:
- Lupus anticoagulant
- Anticardiolipin antibodies IgG/IgM
- Beta-2 glycoprotein I antibodies IgG/IgM

Endocrine and metabolic:
- TSH
- Thyroid peroxidase antibodies
- Prolactin
- HbA1c

Genetic:
- Karyotype

Uterine anatomy:
- 3D pelvic ultrasound

Clinical note:
Partner karyotype must be ordered from the partner’s own record or external referral.
Do not pretend one patient order covers both partners.


TEMPLATE 6
Group: Gynecology and Women’s Health
Name: Abnormal Uterine Bleeding (AUB) Workup
Description: Evaluation of heavy menstrual bleeding, irregular bleeding or postmenopausal bleeding.

Core:
- Complete blood count (CBC)
- TSH
- Transvaginal ultrasound

Conditional:
- Quantitative serum beta-hCG — reproductive age or pregnancy possibility
- Coagulation profile — particularly adolescents or suspected bleeding disorder
- Office endometrial biopsy / sampling — age above 45 or appropriate risk factors

Related pathology, shown but not selected automatically:
- Endometrial biopsy histopathology


TEMPLATE 7
Group: Gynecology and Women’s Health
Name: Pre-Operative Assessment (Major Surgery)
Description: Standard assessment for major gynecologic or obstetric surgery.

Items:
- Complete blood count (CBC)
- ABO blood group and Rh typing
- Fasting blood glucose
- Coagulation profile
- Electrocardiogram (ECG)
- Anesthesia assessment

Coagulation profile resolves to PT, INR, and aPTT without duplication.


TEMPLATE 8
Group: Gynecology and Women’s Health
Name: Vaginitis / Pelvic Infection Panel
Description: Evaluation of persistent discharge, pelvic pain or suspected pelvic infection.

Core:
- Routine urine analysis
- High vaginal swab for microscopy, culture and sensitivity
- Endocervical swab
- Chlamydia NAAT
- Gonorrhea NAAT

Conditional:
- Transvaginal ultrasound — suspected PID, pelvic mass, or tubo-ovarian abscess

Do not select ultrasound automatically for uncomplicated vaginal discharge.
DOCTOR MANAGEMENT
Keep a Doctor-facing Manage Investigations workspace:
- create custom investigation
- canonical category
- subcategory
- modality/specimen
- English and Arabic aliases
- active/archived/all filter
- protected archive with written reason and exact-name confirmation
- restore

Owner-only bulk import/governance stays separate.
