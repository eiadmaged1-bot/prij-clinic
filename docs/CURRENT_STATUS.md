# Current Status

Branch: `feature/v0.12.5-clinic-workflow-unification`.

Latest completed workflow commit before stabilization: `e64c25a` (`Unify patient intake search prescriptions and clinical requests`).

v0.12.5 clinic workflow unification is implemented in local/demo form. Stabilization is focused on failed-test normalization, runner reliability, staging-smoke environment clarity, conflict-marker grep cleanup, and documentation accuracy. It does not add major product features.

Completed workflow features:
- `PatientIntake` and two-stage secretary/reception intake.
- Doctor queue patient selection.
- Universal role-aware live search.
- Prescription templates and doctor saved medication shortcuts.
- Printable prescription builder.
- Clinical Requests wording/facade over existing investigation request persistence.
- External referral/procedure tracking surfaces.
- Expanded investigation catalog.
- Follow-up hints endpoint.
- Workflow RBAC coverage and audit-aware workflow actions.

Stabilization notes:
- Queue cancellation remains reason-required.
- Sensitive admin service price/status updates remain reason-required.
- Accounts RBAC now reports local app/API/DB readiness failures clearly and can auto-start the local dev app.
- Local staging smoke has an explicit Windows-friendly wrapper: `npm run test:staging:smoke:local`.
- Conflict-marker grep false positives were removed from static separators and regex literals.
