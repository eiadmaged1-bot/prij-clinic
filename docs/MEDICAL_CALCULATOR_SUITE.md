# Medical Calculator Suite

The medical calculator suite is clinical calculation infrastructure for local/demo use only. It is not a medical device and must not be used with real patient data.

## Included

- Medical Calculator Hub at `/calculators`
- Formula Registry records in `CalculatorFormula`
- Formula source/version/limitations metadata
- Patient-linked calculation history in `PatientCalculation`
- Verified handler-based calculators only
- Draft/catalog formulas that cannot generate clinical results
- Audit logs for saved, reviewed, locked, voided, and changed calculations

## Verified Handlers

- OB dating arithmetic from LMP, cycle length, conception date, known EDD, GA on date, ultrasound GA on date, and current GA from EDD
- BMI
- BSA Mosteller
- Corrected calcium
- Anion gap
- Serum osmolality
- eGFR CKD-EPI 2021 creatinine
- Cockcroft-Gault creatinine clearance
- Menstrual cycle interval
- Infertility duration

## Safety Rules

Every clinical result must show formula name, code, source/version, input/output units, calculation date, calculated by, limitations, and review status when patient-linked.

Unverified formulas show: “Formula exists in catalog but is not verified for clinical use yet.” They do not generate clinical interpretations.
