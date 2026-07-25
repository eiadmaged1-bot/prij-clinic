# Sprint 1 QA Repair Batch

Baseline: `integration/sprint1-fix3-feature46`

## Approved QA repairs

1. Separate active-pregnancy workflow from ordinary menstrual-cycle activity.
2. Add EDD modes: manual and calculated from LMP, ultrasound, IVF/embryo transfer, or known conception date.
3. Compact Patient Overview and Current Visit calendars for 2K displays.
4. Clean and reorganize pregnancy-history and EDD presentation.
5. Redesign medication search as compact cards with prominent trade name, generic, strength, form, classification, and safety chips.
6. Replace prescription dose/timing/duration free text with structured Arabic quantity, frequency templates, duration stepper/unit, and one optional Note field.

Status: ACTIVE — Package 1 verified; Packages 2–4 remain pending.

## Verified packages

- `QA-PREG-001`: VERIFIED — active pregnancy no longer presents ordinary menstrual-cycle activity; historical baseline remains preserved.
- `QA-EDD-001`: VERIFIED — manual and calculated EDD candidates, clinician confirmation, provenance, correction reason, and dating history are implemented.

## Remaining packages

- `QA-CAL-001`: compact Patient Overview and Current Visit calendars.
- `QA-HIST-001`: clean and reorganize pregnancy-history and EDD presentation.
- `QA-MED-001`: compact medication-result cards.
- `QA-RX-001` and `QA-RX-002`: structured Arabic prescription quantity, timing, and duration.