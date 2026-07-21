# Golden Master Acceptance Checklist

## Objective

Approve an identical, editable copy of the current application before any menu redesign or feature upgrade.

Baseline source:

- Branch: `baseline/prij-v1.5.3-source-freeze`
- Commit: `47c39e4478c9d91231bcdf05bdbcc7c63e597660`

Current gate status: **NOT STARTED — RENDERED BASELINE CAPTURE REQUIRED**

## Status vocabulary

- `PASS` — verified against the frozen application.
- `PARTIAL` — present but not fully verified.
- `FAIL` — differs, is broken, or is missing.
- `BLOCKED` — cannot verify because runtime/data/role access is unavailable.
- `NOT APPLICABLE` — documented reason required.

## Golden Master rules

1. No redesign during the identical-copy phase.
2. No generic substitute for a real component.
3. No fake clinical records added to make a screen look complete.
4. No role leakage.
5. No production branch changes.
6. No backend/database migration solely for visual copying.
7. Existing known bugs are documented separately; they are not silently “fixed” in the baseline.
8. Every intentional deviation must be approved before implementation.

## A. Source freeze

- [x] Exact repository identified.
- [x] Exact source commit identified.
- [x] Immutable baseline branch created.
- [x] Working inventory branch created.
- [x] Default branch confirmed as unsuitable/older.
- [x] Production branch left unchanged.
- [ ] Local working tree confirmed clean or safely preserved before checkout.
- [ ] Local runtime commit confirmed equal to frozen source.

## B. Architecture inventory

- [x] Root providers mapped.
- [x] App shell mapped.
- [x] Navigation registry mapped.
- [x] Role landing/direct-route policy mapped.
- [x] Patient workspace registry mapped.
- [x] Shared patient picker mapped.
- [x] Queue/operations engine mapped.
- [x] Active visit context lock mapped.
- [x] Prescription contracts mapped.
- [x] Investigation contracts mapped.
- [x] Ultrasound/pregnancy contracts mapped.
- [x] Billing contracts mapped.
- [x] Knowledge modules mapped.
- [x] Owner/Admin governance mapped.
- [x] Dedicated print routes mapped.
- [x] API controller contracts mapped.
- [x] Module ownership boundaries documented.

## C. Runtime environment baseline

Record without exposing secrets:

- [ ] Operating system/version.
- [ ] Node version.
- [ ] npm version.
- [ ] Docker version.
- [ ] Browser/version used for baseline.
- [ ] Current local branch and commit.
- [ ] Web URL.
- [ ] API health URL through web proxy.
- [ ] Database reachable.
- [ ] Migrations/repair status.
- [ ] Active clinic theme ID.
- [ ] Active interface mode.
- [ ] Active density mode.
- [ ] Doctor Comfort Mode state.
- [ ] Browser zoom fixed at 100% for screenshots.
- [ ] OS display scaling recorded.

Do not record:

- passwords.
- session cookies.
- CSRF tokens.
- `.env` values.
- real patient identifiers.
- private guideline contents.

## D. Authentication and account states

For every configured role:

- [ ] Login page at desktop.
- [ ] Login page at mobile.
- [ ] English login.
- [ ] Arabic login.
- [ ] Loading/checking-session state.
- [ ] Invalid-credential state using safe QA credentials.
- [ ] Authenticated current-session state.
- [ ] Switch-account action.
- [ ] Logout action.
- [ ] Session-expired return URL.
- [ ] Direct unauthorized route redirects safely.

Roles to verify:

- [ ] Owner.
- [ ] Admin.
- [ ] Doctor.
- [ ] Receptionist.
- [ ] Accountant.
- [ ] Nurse or mark BLOCKED with evidence if no working frontend role contract exists.

## E. Application shell parity

For each role:

- [ ] Brand/logo/clinic name.
- [ ] Sidebar width and collapsed width.
- [ ] Navigation groups and order.
- [ ] Active route state.
- [ ] Icons.
- [ ] Topbar dimensions.
- [ ] Global search placement.
- [ ] Account trigger/sheet.
- [ ] Language control.
- [ ] Appearance entry point where allowed.
- [ ] Logout.
- [ ] Mobile drawer closed by default.
- [ ] Mobile backdrop.
- [ ] Escape close.
- [ ] Swipe close.
- [ ] Body scroll lock while drawer/sheet is open.
- [ ] Minimalistic bottom navigation for Doctor/Receptionist.
- [ ] No menu items outside role/permission contract.

## F. Design-system parity

Capture computed/visual parity for:

- [ ] Canvas/background.
- [ ] Sidebar colors.
- [ ] Primary/secondary/danger buttons.
- [ ] Inputs/selects/textarea.
- [ ] Cards and panels.
- [ ] KPI cards.
- [ ] Tables.
- [ ] Tabs and segmented controls.
- [ ] Badges and status tones.
- [ ] Empty states.
- [ ] Loading skeletons.
- [ ] Errors/notices/success messages.
- [ ] Drawers.
- [ ] Dialogs/modals.
- [ ] Focus states.
- [ ] Hover states.
- [ ] Disabled states.
- [ ] Reduced-motion behavior.
- [ ] High-contrast behavior.

No approval while replacement Unicode icons or generic placeholder components remain.

## G. Route-level baseline capture

Minimum routes:

### Authentication and role landings

- [ ] `/login`
- [ ] `/owner-control`
- [ ] `/dashboard`
- [ ] `/reception`
- [ ] `/doctor`

### Reception/operations

- [ ] `/reception/check-in`
- [ ] `/reception/qr-scan`
- [ ] `/appointments`
- [ ] `/calendar`
- [ ] `/queue`
- [ ] `/doctor/waiting`

### Patients

- [ ] `/patients`
- [ ] `/patients/new`
- [ ] `/patients/import`
- [ ] `/patients/:id` receptionist view.
- [ ] `/patients/:id` doctor view.
- [ ] `/patients/:id` owner/admin view.

### Active visit

- [ ] encounter.
- [ ] complaint.
- [ ] history.
- [ ] examination.
- [ ] impression.
- [ ] prescription.
- [ ] investigations.
- [ ] ultrasound.
- [ ] follow-up.
- [ ] finish/print.
- [ ] context mismatch blocked state.
- [ ] auditable void dialog.

### Clinical centers

- [ ] `/prescriptions` standalone.
- [ ] `/prescriptions?...patientId&encounterId` locked builder.
- [ ] `/investigations` follow-up/manage.
- [ ] `/investigations?...patientId&encounterId` locked ordering.
- [ ] `/ultrasound`.
- [ ] `/pregnancies`.
- [ ] `/clinical-tags`.
- [ ] `/encounters`.
- [ ] `/reports`.

### Knowledge

- [ ] `/guidelines`.
- [ ] guideline search.
- [ ] guideline detail/secure viewer.
- [ ] `/protocol-atlas`.
- [ ] protocol detail.
- [ ] `/medications`.
- [ ] `/dermatology`.
- [ ] `/ai-assistant`.

### Finance and records

- [ ] `/billing`.
- [ ] `/documents`.
- [ ] `/consents`.
- [ ] `/tasks`.
- [ ] `/staff-chat`.

### Administration

- [ ] `/admin`.
- [ ] `/admin/accounts`.
- [ ] `/admin/services`.
- [ ] `/admin/investigations`.
- [ ] medication data administration route.
- [ ] `/admin/settings`.
- [ ] `/admin/security-readiness`.
- [ ] `/admin/appearance`.
- [ ] `/admin/audit`.

### Print

- [ ] `/prescriptions/:id/print` A5.
- [ ] `/clinical-requests/:id/print`.
- [ ] patient/report print routes confirmed from runtime route list.

## H. Patient workspace parity

- [ ] PatientSmartIdentityBar.
- [ ] Important banner.
- [ ] Pregnancy dating card where applicable.
- [ ] MissingInformationCenter.
- [ ] Autosave status and retry.
- [ ] Role-safe panel visibility.
- [ ] Panel order.
- [ ] Panel size.
- [ ] Pin/unpin.
- [ ] Collapse/open.
- [ ] Hide/show.
- [ ] Optimized mode.
- [ ] Minimalistic mode.
- [ ] Mobile panel visibility.
- [ ] History.
- [ ] Current visit launcher.
- [ ] Prescriptions.
- [ ] Investigations/results.
- [ ] Pregnancy.
- [ ] Infertility.
- [ ] Ultrasound.
- [ ] Documents/consents.
- [ ] Billing.
- [ ] Timeline pagination.
- [ ] Tasks/referrals/internal notes.
- [ ] Review hints remain draft/assistive.
- [ ] Panel error boundary.

## I. Workflow parity

### Reception to doctor

- [ ] Find/create patient.
- [ ] Create appointment where required.
- [ ] Check in with idempotency.
- [ ] Queue number shown.
- [ ] Call patient.
- [ ] Doctor preview does not start visit.
- [ ] Select patient.
- [ ] Start/resume locked visit.

### Doctor encounter

- [ ] Save draft.
- [ ] Navigate visit modules without context loss.
- [ ] Add prescription draft.
- [ ] Run medication safety check.
- [ ] Add investigation request.
- [ ] Add follow-up.
- [ ] Finish packet.
- [ ] Void with mandatory reason.

### Prescription

- [ ] Templates/shortcuts/recent.
- [ ] Locked context required.
- [ ] Duplicate prevention.
- [ ] Structured fields.
- [ ] identity confirmation.
- [ ] Doctor review.
- [ ] Alerts handled.
- [ ] Sign.
- [ ] A5 print.

### Investigations

- [ ] Search/categories/favorites.
- [ ] Apply set fills basket only.
- [ ] Persistent draft.
- [ ] Reorder/remove/undo.
- [ ] Per-item indication.
- [ ] Duplicate/prior-result warning.
- [ ] Submit separately.
- [ ] Result received.
- [ ] Doctor review.
- [ ] Print.

### Billing

- [ ] Create invoice.
- [ ] Issue invoice.
- [ ] Idempotent payment.
- [ ] Partial balance behavior.
- [ ] Void with reason.
- [ ] reverse/refund with reason.
- [ ] daily closing.
- [ ] statement.
- [ ] role denial.

## J. State parity

Every significant route must capture applicable:

- [ ] Initial loading.
- [ ] Success with records.
- [ ] Empty.
- [ ] Search no result.
- [ ] Validation failure.
- [ ] 401/session expired.
- [ ] 403/permission denied.
- [ ] 404/not found.
- [ ] 409 duplicate/conflict.
- [ ] network unavailable.
- [ ] timeout.
- [ ] safe server error.
- [ ] offline-local draft.
- [ ] sync pending.
- [ ] sync failed/retry.

## K. Responsive baseline

Required viewport screenshots:

- [ ] 360 × 800.
- [ ] 390 × 844.
- [ ] 430 × 932.
- [ ] 768 × 1024.
- [ ] 1024 × 768.
- [ ] 1280 × 800.
- [ ] 1440 × 900.

At each applicable viewport:

- [ ] No horizontal page overflow.
- [ ] Tables use intended horizontal scroll/container behavior.
- [ ] Drawers/sheets remain reachable.
- [ ] Fixed/sticky actions do not obscure fields.
- [ ] Touch targets remain usable.
- [ ] Patient identity remains visible in clinical writes.
- [ ] Mobile navigation is role-safe.

## L. Arabic and RTL baseline

- [ ] `<html dir>`/direction state updates correctly.
- [ ] Sidebar/drawer direction.
- [ ] Topbar and account sheet.
- [ ] Forms and labels.
- [ ] Tables.
- [ ] Tabs.
- [ ] Patient names and mixed-direction values.
- [ ] Queue copy.
- [ ] Ultrasound statuses.
- [ ] Print mixed-language direction.
- [ ] No untranslated critical action.
- [ ] No mirrored icon/action meaning errors.

## M. Print baseline

### A5 prescription

- [ ] 148 × 210mm.
- [ ] Safe area values applied.
- [ ] Background asset behavior verified.
- [ ] Patient identity.
- [ ] Medication lines.
- [ ] Arabic direction.
- [ ] Notes.
- [ ] doctor signature/stamp space.
- [ ] no app shell.
- [ ] one prescription page unless content overflow is intentionally documented.

### Investigation request

- [ ] A4/declared paper size.
- [ ] Patient/MRN/date/doctor.
- [ ] items/categories.
- [ ] indication/follow-up.
- [ ] signature space.
- [ ] no app shell.

## N. Accessibility and interaction

- [ ] Keyboard reaches every action.
- [ ] Visible focus.
- [ ] Dialog focus handling.
- [ ] Escape closes non-destructive overlays.
- [ ] Labels/accessible names.
- [ ] status messages use suitable live semantics.
- [ ] color is not the sole status indicator.
- [ ] reduced motion.
- [ ] no trap behind mobile drawer.
- [ ] zoom at 200% remains usable for core workflows.

## O. Security and privacy parity

- [ ] RBAC UI matches backend authorization.
- [ ] Direct route checks.
- [ ] Branch scope.
- [ ] CSRF behavior.
- [ ] session cookie behavior.
- [ ] idempotency for duplicate-sensitive writes.
- [ ] audit on protected actions.
- [ ] mandatory reasons.
- [ ] protected account/final owner safeguards.
- [ ] private guideline file access.
- [ ] no PHI/PII in screenshots used outside the protected project.
- [ ] no secrets or cookies in logs/screenshots.
- [ ] AI output remains draft-only and approval gated.
- [ ] prompt-injection protections are not removed by UI extraction.

## P. Visual comparison acceptance

For every major route/state:

```text
Original frozen application screenshot
Golden Master screenshot
Overlay/difference result
Reviewer notes
Status
```

Acceptance targets:

- Layout geometry: visually identical within normal browser-rendering tolerance.
- Typography: same family, size, weight, line height and wrapping.
- Colors: same resolved theme tokens.
- Icons/assets: same approved repository assets.
- Component density: same spacing and information volume.
- Responsive behavior: same breakpoints and navigation behavior.
- Interactions: same visible states and outcomes.

A page is not accepted because it contains the same data labels. It must preserve composition, hierarchy, spacing, states and behavior.

## Q. Defect classification

During baseline review, classify findings as:

- `COPY DEFECT` — Golden Master differs from frozen source.
- `SOURCE BUG` — frozen application itself is broken.
- `DATA/CONFIGURATION` — local role/data/theme state prevents verification.
- `INTENTIONAL FUTURE UPGRADE` — accepted baseline behavior but planned redesign.
- `SECURITY BLOCKER` — unsafe to reproduce without remediation.

Source bugs are documented and copied only when necessary to maintain baseline evidence. Fixes occur in a later controlled module branch unless they block safe capture.

## R. Approval record

Golden Master cannot be marked approved until this section is completed:

```text
Baseline commit:
Golden Master commit:
Date:
Owner reviewer:
Technical reviewer:
Clinical workflow reviewer:
Security/privacy reviewer:
Desktop result:
Mobile result:
Arabic/RTL result:
Print result:
Known accepted source bugs:
Approved deviations:
Decision: APPROVED / REJECTED
```
