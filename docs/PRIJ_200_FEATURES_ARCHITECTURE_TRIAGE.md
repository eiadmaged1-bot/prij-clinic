# Prij Clinic — 200-Feature Architecture Triage

**Date:** 24 July 2026  
**Purpose:** Convert the proposed 200 additions into a safe, buildable roadmap without damaging the current application.

## Core decision

The 200 additions are a **product backlog**, not one coding sprint.

Each feature belongs to one of six groups:

- **NOW-A:** safe next-sprint workflow, display, persistence, audit, and usability work.
- **V1-B:** near-term product work after NOW-A is stable.
- **V2-C:** larger modules requiring deeper models, storage, integrations, or QA.
- **FUTURE-D:** portal, mobile, interoperability, collaboration, research, and advanced AI.
- **MODIFY:** useful idea, but the proposed medical or technical behavior must be redesigned.
- **HOLD:** do not build until a validated source, licensing, local policy, and clinical approval exist.

## Non-negotiable architecture rules

1. Patient Overview is derived from signed encounters, active episodes, completed investigations, prescriptions, ultrasound reports, and follow-up records.
2. Draft and signed data remain separate.
3. Clinical thresholds, calculators, normograms, and warning rules are versioned and source-linked.
4. Suggestions are not actions. The system cannot silently diagnose, prescribe, order, schedule, or modify a signed record.
5. No unsafe hard-coded pregnancy, fertility, oncology, VTE, medication, screening, or imaging rules.
6. Do not create a permanent tab for every specialty idea. Prefer context workspaces and expandable panels.
7. Do not create invented clinical scores.
8. Licensing review is required for SNOMED CT, proprietary calculators, scoring tools, questionnaires, and normograms.
9. Imported or assistant-generated clinical data remains staged until doctor confirmation.
10. Missing historical data remains `Not recorded`; the system must not fabricate it.

## 24 deduplicated architecture epics

1. Patient portal and external access foundation
2. Arabic patient and cohort search
3. Smart identity and safety banner
4. Context-aware patient workspace
5. Longitudinal Patient Overview widgets
6. Pregnancy dashboard and surveillance
7. Gynecology, dysplasia, and pelvic-floor dashboard
8. Infertility, partner, and ART-cycle dashboard
9. Postpartum and menopause dashboard
10. Encounter split-screen and navigation
11. Draft, autosave, offline recovery, and collision control
12. Signing, addendum, cancellation, and record immutability
13. Structured complaint engine
14. Structured obstetric, gynecology, fertility, and medical history
15. Clinical macros and documentation acceleration
16. Investigation bundles, critical results, and follow-up linkage
17. Prescription safety and medication context
18. Ultrasound, DICOM, charts, and structured reporting
19. Printing, patient instructions, QR, and portal assets
20. Clinical terminology and coding
21. Rules engine and protocol triggers
22. Staff collaboration and real-time editing
23. Research and clinical-trial governance
24. Security, audit, consent, provenance, and licensing

# Build sequence

## Sprint A — Encounter & Patient Overview Hardening

Approved feature numbers:

`7, 8, 9, 13, 15, 17, 18, 22, 23, 28, 45, 46, 47, 49, 101, 102, 106, 107, 108, 109, 110, 111, 115, 119, 150, 200`

Scope:

- Patient banner correctness
- Longitudinal complaint and menstrual visibility
- Encounter usability
- Draft and sync safety
- Signed-record integrity
- Read-only historical review

Excluded:

- Clinical calculators
- Diagnosis pathways
- Medication recommendations
- New specialty tabs
- DICOM
- Portal
- Research
- Voice/NLP AI

## Sprint B — Structured Complaint & History Engine

Feature groups:

- 151–160
- 161–164
- 167–174
- 176
- 180–182
- 186
- 188
- 192

## Sprint C — Context Dashboards

Descriptive, source-linked pregnancy, gynecology, infertility, postpartum, and menopause dashboards.

## Sprint D — Validated Clinical Rules

Only after source review, licensing, local protocol approval, tests, and clinician sign-off.

## Sprint E — Imaging, Portal, Collaboration, and Research

DICOM SR, secure media, patient portal, expiring QR assets, real-time collaboration, SNOMED mapping, and clinical-trial matching.

# Important feature decisions

## Build now / safe foundation

- Derived G/P/A/L and previous-CS count
- Consanguinity and communication-needs banner fields
- Preferred name
- Active bleeding and unresolved-action indicators
- Lab delta display with compatible units
- Refractory complaint lifecycle state
- Complaint severity trend from signed snapshots
- Menstrual three-month calendar using recorded dates only
- Responsive split-screen encounter
- Section jump navigation
- Pause, cancel-with-reason, and addendum workflows
- Field provenance
- Revision-safe autosave and real sync states
- Required follow-up disposition before signing
- Unresolved prior complaint review
- Read-only past-visit view
- Permanent-history correction protection

## Modify before implementation

- Single EFW centile must not automatically become SGA/FGR.
- Partner Rh status must not automatically become an incompatibility diagnosis.
- Cycle phase must be labelled estimated and must not assume day-14 ovulation.
- PCOS phenotype must be clinician-selected, not silently diagnosed.
- Semen traffic-light thresholds must be source-linked and must display the actual values.
- Critical lab alerts must be method-, unit-, age-, sex-, and pregnancy-aware.
- IV iron must not be recommended from Hb alone.
- CPR must not automatically distinguish FGR from SGA.
- HRT review cannot be reduced to a simple 2×2 risk grid.
- LH:FSH must not be used alone to identify PCOS or diminished reserve.
- “Normal examination” cannot mark an examination that was not performed.
- Clone Previous Visit must not silently copy impression, diagnosis, prescription, or current findings.
- Text parsing may create a draft follow-up suggestion only.
- Context prescription sorting may use approved favourites, but must not imply treatment recommendation.
- Myomectomy cavity entry may trigger obstetric-planning review, not an automatic VBAC prohibition.
- Allergy cross-reactivity requires reaction phenotype, severity, timing, and reviewed rules.
- Pathology pending creates a prominent task; it does not lock the whole patient file.
- Postmenopausal bleeding creates an urgent evaluation workflow, not one universal mandatory test.
- Breast-mass workup must not use a simple age-only ultrasound/mammogram rule.

## Hold until validated/licensed

- Simplified FMF-labelled preeclampsia logic
- Hand-coded MFMU VBAC calculator
- ASCCP and Swede-score pathways without review
- O-RADS automation
- Invented ovarian-reserve score
- FRAX cloning without approved integration
- Invented OHSS risk score
- Real-time differential diagnosis ranking
- Automatic aspirin or dose insertion
- Combined Caprini/RCOG score
- Automatic PID antibiotics
- Automatic PPROM medications
- Automatic final ICD-10 code assignment

## Future

- Patient portal and mobile companion app
- Secure external media and DICOM SR integration
- CRDT/Google-Docs-style multi-user editing
- Expiring QR links to portal assets
- SNOMED terminology service
- Voice-to-tag NLP
- Clinical-trial matching with ethics and consent governance

# Definition of done

A feature is complete only when:

1. Data source and ownership are defined.
2. Draft versus signed behavior is defined.
3. Empty, unknown, declined, and not-applicable states exist.
4. Backend RBAC and patient scope are enforced.
5. Sensitive actions are audited.
6. Desktop and mobile behavior are tested.
7. No duplicate source of truth is created.
8. Clinical source/version is visible when applicable.
9. Doctor confirmation and override behavior are defined.
10. Focused tests, typecheck, build, and `git diff --check` pass.
11. Protected data counts do not decrease.
12. No commit, push, or tag occurs without explicit authorization.
