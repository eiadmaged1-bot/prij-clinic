# Golden Master Screenshot Manifest

## Naming standard

```text
<sequence>-<role>-<route-or-state>-<language>-<viewport>.png
```

Examples:

```text
001-owner-owner-control-en-1440x900.png
002-doctor-patient-profile-en-390x844.png
003-reception-queue-ar-430x932.png
```

Rules:

- Use lowercase kebab-case.
- Use role names only, never account names.
- Do not include patient names/MRN/phone in filenames.
- Use the exact viewport dimensions.
- Use `en` or `ar`.
- Add state suffixes such as `loading`, `empty`, `error`, `drawer-open`, `modal-open`, `print-preview`.
- Do not commit screenshots until privacy review passes.

## Evidence folders

```text
artifacts/golden-master/screenshots/
  desktop/
  tablet/
  mobile/
  rtl/
  states/
  print/
  comparison/
```

## Checkpoint A — Source/theme confirmation

Required first:

```text
desktop/001-login-en-1440x900.png
desktop/002-owner-owner-control-en-1440x900.png
desktop/003-doctor-home-en-1440x900.png
desktop/004-reception-home-en-1440x900.png
mobile/001-doctor-home-en-390x844.png
mobile/002-reception-home-en-390x844.png
rtl/001-reception-home-ar-390x844.png
```

Do not proceed to the full manifest until these confirm the correct source and active visual configuration.

## Checkpoint B — Shell and authentication

For each applicable role at 1440×900 and 390×844:

```text
login-en
login-ar
login-loading
login-invalid-credentials
current-session
sidebar-open
sidebar-collapsed
drawer-open
account-menu-open
unauthorized-route-redirect
session-expired
```

Roles:

```text
owner
admin
doctor
reception
accountant
nurse-when-configured
```

## Checkpoint C — Owner/Admin routes

Desktop 1440×900, mobile 390×844, plus one tablet 768×1024:

```text
owner-control
admin-home
admin-accounts
admin-accounts-editor
admin-services
admin-services-editor
admin-investigation-catalog
admin-investigation-editor
admin-medication-data
admin-clinic-settings
admin-clinic-settings-edit
admin-security-readiness
admin-appearance
admin-audit
patient-import
```

Required states:

```text
loading
empty
permission-denied
validation-error
success
modal-or-drawer-open
pagination-page-2-when-available
```

## Checkpoint D — Reception routes

Desktop 1440×900 and mobile 390×844:

```text
reception-home
reception-check-in-search
reception-check-in-selected
reception-check-in-confirmed
reception-qr-scan
patient-new
appointments
calendar
queue
queue-empty
queue-with-called-patient
queue-cancelled-history
reception-patient-profile
```

Arabic checkpoints:

```text
reception-home-ar-390x844
reception-check-in-ar-390x844
queue-ar-390x844
reception-patient-profile-ar-390x844
```

## Checkpoint E — Doctor routes

Desktop 1440×900 and mobile 390×844:

```text
doctor-home
doctor-home-loading
doctor-home-partial-error
doctor-current-patient
doctor-no-current-patient
doctor-waiting
doctor-waiting-preview
doctor-case-library
patient-search-mobile
```

## Checkpoint F — Patient directory and registration

Desktop 1440×900, tablet 768×1024 and mobile 390×844:

```text
patients-all
patients-search-results
patients-no-results
patients-favorites
patients-waiting
patients-mobile-cards
patient-new-empty
patient-new-validation
patient-new-duplicate-warning
patient-import
```

## Checkpoint G — Patient workspace

Use one safe QA/training patient for each applicable context:

```text
obstetric
high-risk-obstetric
gynecology
infertility
postpartum
preventive
other
```

For Owner/Admin/Doctor and Receptionist variants:

```text
patient-summary
patient-identity-bar
patient-important-banner
patient-missing-information
patient-autosave-saving
patient-autosave-saved
patient-autosave-error
patient-workspace-editor
patient-history
patient-current-visit
patient-allergies
patient-medications
patient-prescriptions
patient-investigations
patient-pregnancy
patient-infertility
patient-ultrasound
patient-documents
patient-consents
patient-billing
patient-timeline
patient-tasks
patient-referrals
patient-internal-notes
patient-review-hints
patient-panel-error
patient-more-menu
```

Interface configurations:

```text
optimized-comfort
minimalistic-comfort
optimized-compact
optimized-large
doctor-comfort-mode
```

Capture only configurations actually available in the frozen runtime; do not change the first baseline configuration until Checkpoint A is approved.

## Checkpoint H — Active visit

Desktop 1440×900 and mobile 390×844:

```text
visit-encounter
visit-complaint
visit-history
visit-examination
visit-impression
visit-prescription-empty
visit-prescription-search
visit-prescription-lines
visit-prescription-safety
visit-investigations-handoff
visit-ultrasound
visit-follow-up
visit-finish-print
visit-context-mismatch
visit-void-dialog
visit-void-validation
```

The patient identity/encounter bar must be visible in every clinical write screenshot.

## Checkpoint I — Prescription Center

Standalone:

```text
prescriptions-templates
prescriptions-shortcuts
prescriptions-recent
prescriptions-empty
```

Locked patient/encounter:

```text
prescription-builder-empty
prescription-medication-search
prescription-duplicate-warning
prescription-structured-line
prescription-review-hints
prescription-print-not-ready
prescription-print-ready
prescription-signed
```

Print:

```text
print/prescription-a5-screen-1440x900.png
print/prescription-a5-preview.png
print/prescription-a5-arabic-preview.png
```

## Checkpoint J — Investigation Center

Standalone:

```text
investigations-follow-up
investigations-follow-up-filtered
investigations-manage-sets
investigations-empty
```

Locked patient/encounter:

```text
investigation-catalog
investigation-category
investigation-favorites
investigation-set-applied
investigation-basket
investigation-item-indication
investigation-duplicate-warning
investigation-prior-result-warning
investigation-saved
investigation-result-received
investigation-reviewed
```

Print:

```text
print/investigation-request-screen-1440x900.png
print/investigation-request-preview.png
print/investigation-request-arabic-preview.png
```

## Checkpoint K — Ultrasound and pregnancy

```text
ultrasound-history
ultrasound-today
ultrasound-drafts
ultrasound-needs-review
ultrasound-signed
ultrasound-incomplete
ultrasound-filtered
ultrasound-empty
ultrasound-patient-editor
ultrasound-structured-findings
ultrasound-review
ultrasound-sign
ultrasound-amend
pregnancy-list
pregnancy-patient-panel
pregnancy-dating
pregnancy-fetus
pregnancy-antenatal-visit
infertility-cycle-monitoring
```

## Checkpoint L — Billing

Owner/Admin/Accountant where permitted:

```text
billing-home
billing-loading
billing-permission-denied
billing-create-invoice
billing-invoice-validation
billing-invoice-issued
billing-record-payment
billing-payment-success
billing-open-balances
billing-daily-closing
billing-finance-report
billing-patient-statement
billing-void-prompt
billing-refund-reverse
```

## Checkpoint M — Knowledge Center

Guidelines:

```text
guidelines-home
guidelines-empty
guidelines-search
guidelines-no-result
guidelines-synthesis
guidelines-detail
guidelines-secure-viewer
guidelines-download-denied
guidelines-review
guidelines-upload
guidelines-private-vault
```

Protocol Atlas:

```text
protocol-atlas-list
protocol-atlas-cards
protocol-atlas-verified
protocol-atlas-draft
protocol-atlas-catalog-only
protocol-detail
protocol-editor
protocol-verification
```

Pharmacology:

```text
pharmacology-home
pharmacology-search
pharmacology-profile-quick
pharmacology-profile-clinical
pharmacology-profile-source
pharmacology-source-incomplete
pharmacology-source-conflict
pharmacology-compare
pharmacology-interactions
pharmacology-favorites
```

Dermatology and AI:

```text
dermatology-home
dermatology-detail
ai-assistant
aI-drafts-empty
ai-draft-review
ai-doctor-approval-gate
```

## Checkpoint N — Other records/workflows

```text
encounters
documents
consents
tasks
staff-chat
reports
clinical-tags
external-intake
```

Capture permission/empty/error states where applicable.

## Checkpoint O — Responsive widths

After major-route capture at 1440×900 and 390×844, run representative shell and workflow pages at:

```text
360x800
430x932
768x1024
1024x768
1280x800
```

Representative pages:

- Owner Control.
- Reception home/check-in.
- Queue.
- Patient directory.
- Patient workspace.
- Active visit.
- Prescription builder.
- Investigation ordering.
- Ultrasound history.
- Billing.
- Guidelines.
- Admin accounts.

## Checkpoint P — Comparison files

For each accepted route:

```text
comparison/<route>-original.png
comparison/<route>-golden-master.png
comparison/<route>-overlay.png
comparison/<route>-notes.md
```

Notes template:

```text
Route:
Role:
Language:
Viewport:
Original commit:
Golden Master commit:
Theme/interface/density:
Intentional differences:
Unexpected differences:
Status: PASS/PARTIAL/FAIL/BLOCKED
Reviewer:
```

## Privacy review status

Each screenshot receives one of:

```text
SAFE_QA_DATA
REDACTED
DO_NOT_SHARE
RECAPTURE_REQUIRED
```

No screenshot is committed or uploaded until marked `SAFE_QA_DATA` or `REDACTED` by the project owner.
