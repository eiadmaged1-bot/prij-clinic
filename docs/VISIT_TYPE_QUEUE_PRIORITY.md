# Visit Type Queue Priority

Visit types are:
- `كشف`
- `إعادة`
- `استشارة`
- `مستعجل`

`مستعجل` maps to `urgent_kashf`. It is a separate urgent examination visit type. When checked in, it sorts after any patient already with the doctor and before routine waiting patients. Multiple urgent patients keep their urgent check-in order. Normal queue order resumes after urgent patients.

The priority is ordering/status only. Queue tickets are not hard-deleted or renumbered.
