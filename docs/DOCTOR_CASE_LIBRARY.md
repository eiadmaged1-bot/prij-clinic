# Doctor Case Library

The Doctor Case Library is separate from the Guideline Library.

Access:

- Owner/Admin: all clinic cases.
- Trusted Doctor: own cases and colleague cases.
- Standard Doctor later: own cases only when configured without `clinical_case_library.view_all`.
- Receptionist: no clinical case library.
- Accountant: no clinical case library.

This app is configured for trusted two-doctor clinic use by granting current Doctor role access to own and all clinical cases.

Viewing colleague clinical cases records `CLINICAL_CASE_VIEWED` when audit context is available.
