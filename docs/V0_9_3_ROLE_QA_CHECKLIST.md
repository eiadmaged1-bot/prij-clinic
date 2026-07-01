# v0.9.3 Role QA Checklist

Use seeded demo accounts only. Verify both navigation visibility and direct URL denial.

Sensitive pages that must be denied to non-authorized roles:

- `/admin`
- `/admin/drug-market`
- `/admin/drug-market/automation`
- `/admin/drug-market/review-queue`
- `/admin/medications`
- `/medications/safety`
- `/admin/protocol-atlas`
- `/ai-drafts` if restricted
- `/admin/calculators` if restricted

## Owner/Admin

Expected visible navigation:

- [ ] Dashboard
- [ ] Patients and new patient creation
- [ ] Calendar and appointments
- [ ] Queue
- [ ] Doctor/clinical workflow pages
- [ ] Billing/finance/reports
- [ ] Orders/investigations
- [ ] Medications and drug market
- [ ] Medication safety
- [ ] Guidelines/protocols
- [ ] AI drafts if enabled for review
- [ ] Calculators
- [ ] Admin and owner controls

Expected hidden pages:

- [ ] None of the owner/admin governance pages should be hidden from the system owner.

Expected allowed actions:

- [ ] Manage local demo accounts and roles.
- [ ] Review audit-facing controls.
- [ ] Access drug-market automation/review/admin pages.
- [ ] Access medication safety/admin pages.
- [ ] Access guideline/protocol admin pages.
- [ ] Access finance and service catalog controls.

Expected denied actions:

- [ ] Cannot bypass audit expectations for clinical/admin changes.
- [ ] Cannot create autonomous prescribing or final AI clinical output.
- [ ] Cannot use real patient data, real payment gateway, or external AI.

## Doctor

Expected visible navigation:

- [ ] Dashboard
- [ ] Patients and patient workspace
- [ ] Calendar/appointments as allowed
- [ ] Queue as allowed
- [ ] Doctor workspace
- [ ] Encounters, prescriptions, investigations, reports
- [ ] Medications/search
- [ ] Guidelines/protocols
- [ ] Calculators if allowed
- [ ] AI drafts if allowed and clearly draft-only

Expected hidden pages:

- [ ] Admin
- [ ] Owner controls
- [ ] Accounts/RBAC management
- [ ] Drug-market automation
- [ ] Drug-market review queue unless explicitly authorized
- [ ] Guideline/protocol admin unless explicitly authorized
- [ ] Calculator admin unless explicitly authorized

Expected allowed actions:

- [ ] Open assigned patient workspaces.
- [ ] Work in doctor visit flow.
- [ ] Create/review doctor-authored clinical notes as supported.
- [ ] Use medication reference and safety support as doctor-reviewed support.

Expected denied actions:

- [ ] Cannot manage users/roles.
- [ ] Cannot access owner-only finance controls.
- [ ] Cannot approve/import drug-market automation unless authorized.
- [ ] Cannot convert AI draft output into autonomous clinical decisions.

## Nurse

Expected visible navigation:

- [ ] Dashboard
- [ ] Patients and patient workspace as allowed
- [ ] Queue as allowed
- [ ] Orders/investigations as allowed
- [ ] Reports as allowed
- [ ] Medication reference as allowed

Expected hidden pages:

- [ ] Admin
- [ ] Owner controls
- [ ] Accounts/RBAC management
- [ ] Drug-market automation
- [ ] Drug-market review queue
- [ ] Medication safety admin if restricted
- [ ] Guideline/protocol admin
- [ ] AI drafts if restricted
- [ ] Calculator clinical tools if restricted

Expected allowed actions:

- [ ] Support queue and patient workflow within assigned permissions.
- [ ] View or update nursing-appropriate workflow items where implemented.
- [ ] Access permitted patient context without owner/admin controls.

Expected denied actions:

- [ ] Cannot manage roles/users.
- [ ] Cannot approve clinical records as doctor-only final decisions.
- [ ] Cannot access drug-market automation/review pages unless explicitly authorized.
- [ ] Cannot access restricted AI/calculator admin pages.

## Receptionist

Expected visible navigation:

- [ ] Dashboard
- [ ] Patients
- [ ] New patient creation
- [ ] Calendar/appointments
- [ ] Queue
- [ ] Limited billing/finance if allowed

Expected hidden pages:

- [ ] Admin
- [ ] Owner controls
- [ ] Accounts/RBAC management
- [ ] Doctor-only clinical workspace if restricted
- [ ] Drug-market automation
- [ ] Drug-market review queue
- [ ] Medication safety
- [ ] Guideline/protocol admin
- [ ] AI drafts
- [ ] Calculator clinical tools if restricted

Expected allowed actions:

- [ ] Register fake/demo patients.
- [ ] Manage appointment and queue workflows within permissions.
- [ ] Open patient administrative context as allowed.

Expected denied actions:

- [ ] Cannot manage users/roles.
- [ ] Cannot access doctor-only clinical decision tools.
- [ ] Cannot access medication automation/safety admin pages.
- [ ] Cannot access restricted finance owner controls.

## Accountant

Expected visible navigation:

- [ ] Dashboard if allowed
- [ ] Billing
- [ ] Finance
- [ ] Patient statements/payment records as allowed
- [ ] Reports/finance reports as allowed

Expected hidden pages:

- [ ] Admin
- [ ] Owner controls unless explicitly authorized
- [ ] Accounts/RBAC management
- [ ] Doctor-only clinical workspace
- [ ] Drug-market automation
- [ ] Drug-market review queue
- [ ] Medication safety
- [ ] Guideline/protocol admin
- [ ] AI drafts
- [ ] Calculator clinical tools if restricted

Expected allowed actions:

- [ ] Review demo invoices and manual payments.
- [ ] Access finance reports within permissions.
- [ ] Work with patient billing context as allowed.

Expected denied actions:

- [ ] Cannot access clinical decision tools.
- [ ] Cannot manage users/roles.
- [ ] Cannot access medication/guideline/AI admin pages.
- [ ] Cannot create real payment gateway transactions.
