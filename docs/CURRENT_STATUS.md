# Current Status

v0.14.3.1 post-visual hotfix is in verification on the local demo branch.

Completed in v0.14.3:
- New Patient hides sex/gender from reception and defaults sex internally to female for the OB/GYN workflow.
- Sexual activity status is optional under Sensitive clinical details.
- Sidebar collapse/drawer behavior, density lock classes, compact calendar/reception/check-in, patient action drawers, patient summary, doctor current patient card, collapsed workflow help, Protocol Atlas, AI Drafts, medication live search, official medicine wording, and account creation/demo visibility were repaired.
- Demo/training records are hidden by default on key patient/reception/calendar/account surfaces.

Completed in this sprint:
- Premium patient universe, reception today desk, date search, context-aware forms, smart search shortcuts, complaint cards, autosave draft foundation, offline sync queue, autosave sync health, and owner control center upgrade.
- Doctor Comfort Mode with local persistence, doctor/owner top-bar toggle, owner-managed appearance default, larger controls, simplified patient workspace tabs, and calmer doctor visit surfaces.
- Premium 3D UI polish for reusable medical icons, cards, and action surfaces.
- Smart empty states with safe local next actions.
- Human-readable audit and record labels.
- Compact demo and safety badges that keep AI draft-only and doctor-review boundaries visible.

Completed in v0.14.3.1:
- Comfort Mode topbar utility buttons stay compact and nowrap.
- Reception New Patient hides patient type while keeping internal compatibility defaults.
- Account creation supports blank email with internal non-login compatibility email and friendly errors.
- Demo/test accounts and guideline training documents are hidden by default with toggles.
- Audit read/view events are hidden by default in Owner Control.
- Clinical request selections are compact chips.
- Prescriptions, investigations, and check-in use a searchable PatientPicker.
- Protocol Atlas opens in compact list view by default.
- Reception Today no longer duplicates patient search sections.

Safety status:
- Local demo/training data only. Do not enter real patient data.
- AI remains disabled or draft-only support. It cannot diagnose, prescribe, sign, or silently update final records.
- Clinical record changes remain RBAC-protected and audit-log oriented.
- No WhatsApp, DICOM/PACS, external AI, or real payment gateway integration is enabled.
