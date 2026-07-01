# Prij Heritage Theme

Sprint: v0.9.2 Prij Heritage Theme + Medication UI Declutter

Source file:
- `docs/design/prij-clinic-theme.html`

Implemented from the source:
- Dark ink sidebar
- Warm paper page background
- White card surfaces
- Teal primary actions
- Terracotta active navigation/accent treatment
- Muted clinical success, warning, and danger colors
- Fraunces, IBM Plex Sans, and IBM Plex Mono font-family ideas with safe fallbacks only
- Rounded cards and warm ink-tinted shadows
- Top patient search bar
- Patient-file-first navigation language
- Reusable Prij Heritage component helpers

Not imported:
- Fictional patient names
- Fake appointment rows
- Fake finance values
- Fake medication rows
- Patient dosing or how-to-take wording
- Font files
- Static iframe or separate preview page

Medication UI declutter:
- Normal medication and drug-market UI hides Registration, Official/source price, Official listed price, Source price, Import run, Parser confidence, Official row fields, and Row preview.
- Backend source metadata, official row JSON, parser confidence, registration number, price fields, import runs, export, restore, and verification workflows are preserved.
- Admin review now shows simplified trust language and keeps source audit wording collapsed by default.

Safety:
- Medication data remains reference metadata only.
- Strength/form/pack are market metadata only and never patient dosing instructions.
- No external AI, auto-prescribing, checkout, stock, order, or purchase workflow was added.
