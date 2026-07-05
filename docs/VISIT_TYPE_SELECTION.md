# Visit Type Selection

Reception check-in requires exactly one visit type:

- `kashf` -> `كشف`
- `recheck` -> `إعادة`
- `consultation` -> `استشارة`
- `urgent_kashf` -> `مستعجل`

`مستعجل` means urgent examination / `كشف مستعجل`. It is a separate visit type, not an optional priority flag.

Queue check-in rejects missing visit type and audit metadata records the selected type.
