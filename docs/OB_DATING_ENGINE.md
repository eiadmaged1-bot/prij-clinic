# OB Dating Engine

The OB dating engine creates doctor-reviewable EDD candidates. It does not silently change the Best Obstetric EDD.

## Supported Inputs

- LMP
- LMP with cycle length adjustment
- Conception date
- IVF transfer date with embryo age
- Known EDD
- GA on known date
- Ultrasound GA on scan date
- Raw ultrasound measurement recording only when formulas are unverified

## Best Obstetric EDD

- One active best estimate is maintained per active pregnancy episode.
- Doctor review can set a dating candidate as Best Obstetric EDD.
- Doctor review can lock the Best Obstetric EDD.
- Changing a locked EDD requires a reason and creates an audited replacement record.
- Previous dating assessments remain in history.

## Patient Type Behavior

- OB patients show the live OB Dating Card.
- GYN and Women Health patients hide the card unless an active pregnancy episode exists.
- Ending a pregnancy episode hides the live card while old dating remains in history.

## Safety

The engine does not diagnose, prescribe, interpret fetal images, diagnose FGR, or replace clinician review.
