# Manual QA Wave 1

Status: **PENDING — not executed by the Part H recovery sprint.**

Follow `MANUAL_QA_WAVE_1_STARTUP.md` and use only synthetic data in a fresh `_test_part_h_` database. Record Pass, Fail plus defect ID, or Blocked for every role/language/viewport combination; do not infer a pass from automated tests.

## Coverage Matrix

Roles:

- [ ] Doctor
- [ ] Receptionist
- [ ] Owner
- [ ] Nurse

Viewports:

- [ ] 1440×900
- [ ] 360×800
- [ ] 390×844
- [ ] 430×932
- [ ] 768×1024

Languages and direction:

- [ ] English LTR
- [ ] Arabic RTL

## Authentication and Operational Security

- [ ] Login and logout work through `/api/backend`; invalid login is safely rejected.
- [ ] Session persists across navigation/reload and logout revokes it.
- [ ] Approved session-revocation scenarios terminate active sessions.
- [ ] Mutating browser requests contain the CSRF header and same-origin cookies.
- [ ] Rate limiting yields the structured 429 state without leaking credentials.
- [ ] Owner diagnostics displays health and safe recent audit information.
- [ ] Error screens show a safe message and requestId without PHI.
- [ ] External-device traffic reaches web port 3100 only; API port 3101 is not exposed.

## Interface Modes and Navigation

- [ ] Optimized mode preserves the complete role-appropriate workspace.
- [ ] Minimalistic mode preserves Summary, Visit, Rx, Requests, and More for an authorized doctor.
- [ ] Receptionist Minimalistic navigation exposes no clinical module/action.
- [ ] Mode preference persists as designed without changing permissions.
- [ ] Mobile navigation has no horizontal overflow, unreachable control, or obscured content.
- [ ] Browser back/forward restores patient workspace modules.
- [ ] A copied `?module=` deep link reloads the correct authorized module.
- [ ] Forbidden deep links do not fetch or reveal the module.

## Patient and Clinic Workflows

- [ ] Exact MRN, normalized phone, English prefix, and Arabic prefix patient searches work.
- [ ] Search remains branch scoped and returns no cross-branch patient.
- [ ] Create Patient and duplicate-candidate review work with unique synthetic fixtures.
- [ ] Concurrent matching creation does not create duplicate patients.
- [ ] Save Patient Only and Save & Start Visit preserve their response and audit behavior.
- [ ] Appointments create/update/cancel flows remain role scoped.
- [ ] Queue check-in and permitted transitions work without duplicate transition.

## Patient Workspace and Clinical Modules

- [ ] Summary opens with no duplicate patient request or all-tab preload.
- [ ] Visit workflow, finish, and reason-required audited void behavior work for authorized roles.
- [ ] Receptionist cannot invoke encounter, prescription, or investigation creation directly.
- [ ] Prescription creation and viewing preserve doctor workflow.
- [ ] Investigation/request creation and results preserve permission boundaries.
- [ ] Documents upload, quarantine/readiness, download, and receptionist category restrictions work.
- [ ] Billing and payment work; prohibited void/adjust actions remain unavailable and denied.
- [ ] Timeline loads newest-first, loads older pages once, and shows no duplicate/missing item.
- [ ] Pregnancy, infertility, ultrasound, reports, and diagnostics load only for authorized roles.

## Presentation and Accessibility

- [ ] Arabic labels render correctly with RTL layout and logical control order.
- [ ] English labels render correctly with LTR layout.
- [ ] Dialogs, loading states, empty states, and errors remain usable at every viewport.
- [ ] Touch controls are usable on phone viewports and keyboard focus remains visible.
- [ ] No synthetic patient name, MRN, phone, filename, token, or credential appears in logs/screenshots unexpectedly.

## Evidence Summary

- Execution date: _pending_
- Tester: _pending_
- Environment/database name only: _pending_
- Passed: _pending_
- Failed/defect IDs: _pending_
- Blocked: _pending_
- Final disposition: _pending_
