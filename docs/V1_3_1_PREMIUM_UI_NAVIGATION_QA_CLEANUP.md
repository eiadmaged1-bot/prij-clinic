# v1.3.1 Premium UI + Navigation QA Cleanup

v1.3.1 fixes the first manual QA issues found after v1.3.0 before broader QA continues.

Scope:
- Arabic language switching translates text without rearranging layout, icons, logo, cards, forms, topbar controls, or sidebar structure.
- The root page is a premium minimal staff entry.
- Normal UI removes demo/local/not-real clutter.
- Dashboard and admin cards are compact.
- Clinic Settings is editable for Owner/Admin.
- Navigation is role-based and workflow-first.
- Local same-PC and Tailscale QA remain mandatory.

Preserved v1.3.0 features:
- Doctor visit signature and doctor color marker.
- Doctor case library and trusted doctor access.
- Staff chat with seen/read status.
- Receptionist queue workflow and urgent `مستعجل` priority.
- Doctor preview mode.

Safety:
- External AI remains disabled by default.
- AI output remains draft-only until reviewed and approved by a doctor.
- No autonomous diagnosis, prescribing, dosing, or treatment ranking.
