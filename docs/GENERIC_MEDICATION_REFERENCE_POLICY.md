# Generic Medication Reference Policy

The v0.12.2 medication catalog is a lookup reference for doctors.

Rules:
- Generic names only.
- No trade names or brand names.
- No price, stock, availability, supplier, purchase, sales, cart, or checkout fields.
- No automated dose, frequency, duration, or instruction generation.
- No AI prescribing, treatment ranking, “best drug,” “recommended drug,” or “safe drug” wording.
- Controlled generic medication rows are not seeded by default and must remain hidden from normal selection unless a later RBAC-controlled review flow is added.

Allowed search inputs include generic name, family/class, pharmacologic group, function tag, and clinical alias such as `pain killer`, `NSAID`, `antibiotics`, `antiemetic`, or `anticoagulant`.

Search output must stay descriptive: labels, IDs, class/family, tags, and flags only.
