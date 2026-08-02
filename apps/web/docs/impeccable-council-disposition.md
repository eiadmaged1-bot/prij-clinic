# Impeccable Council Disposition — Doctor Workspace

Date: 2026-07-30

Reviewed source: `apps/web/docs/impeccable-doctor-workspace-critique.md`.

Council members represented: Product, Design, Clinical Safety, Technology, Security, Quality, Data/AI, and Operations.

## Executive decision

Impeccable's original critique was valid for the pre-Cockpit workspace. Its critical architecture recommendations have now been substantially implemented and protected by static and real API/PostgreSQL runtime gates.

Impeccable is not fully closed because its own report explicitly did not perform live browser, screenshot, contrast, assistive-technology, mobile, tablet, or Arabic visual verification. The remaining closure gate is targeted manual browser QA plus a small post-QA polish sprint.

Council decision: approve the merged architecture; block release promotion until manual browser QA passes; do not reopen the architecture or perform a radical redesign before evidence is collected.

## Ranked Impeccable backlog disposition

| Rank | Original recommendation | Current council status | Decision |
|---:|---|---|---|
| 1 | One server readiness/sign gate; persistent Review only | Complete | Preserve. No direct Finish outside Review. Keep server readiness, revision checks, idempotency, audit, and signed read-only as release gates. |
| 2 | Unify local foundation and routed visit | Complete for routine workflow | Preserve Classic and Cockpit as two interfaces over one shared encounter controller and draft. Do not restore a separate local-only routine draft. |
| 3 | Shared canonical seven-stage registry | Complete | Preserve one stage registry: Patient Context, History, Examination, Assessment, Investigations, Plan, Review. |
| 4 | Discriminated auth/role state | Complete in Cockpit controller | Verify manually: loading, authentication-failed, access-denied, resource-failed, partial-ready, ready. |
| 5 | Per-resource status; unavailable must not look empty | Complete in packet/controller and Cockpit | Verify failed/partial/unavailable/empty states in browser. |
| 6 | Required identity plus More context at named widths | Substantially complete | Manual viewport QA required at 1440, 1280, 1024, 820, 390, and 320. Any hidden safety context is a high-severity defect. |
| 7 | Real retry and sync conflicts | Complete in controller | Verify retry, offline waiting-sync, local recovery, stale revision conflict, and no silent overwrite. |
| 8 | Proper active navigation semantics | Complete for Cockpit stage rail | Preserve tablist/tab/tabpanel semantics and keyboard direction behavior; verify with keyboard and RTL. |
| 9 | Consolidate tokens and 44px shell | Complete for Cockpit, incomplete across legacy patient shell | Do not perform a broad global CSS rewrite before QA. Fix only evidence-backed legacy-shell defects after screenshots. |
| 10 | Operational Review checklist with artifact status/owner/link | Partial | Approve a focused post-QA sprint. Review must show factual status and links for prescriptions, investigations/results, follow-up, procedures, and unresolved handoffs without inventing clinical rules. |
| 11 | Typed controlled form/hooks; reduce giant components | Partial | Defer broad refactor. Approve only incremental extraction when changing an affected workflow, with focused tests and no behavior rewrite. |
| 12 | UTF-8/localization hardening | Partial | Approve focused Arabic/RTL and mixed-direction fixes found by QA. Do not mass-translate or change clinical meaning without review. |

## Path decision

Original Path A: conservative safety repair.

Status: its main safety requirements are complete.

Original Path B: radical Visit Cockpit redesign.

Status: the safe core of Path B has been implemented as optional Visit Cockpit while Classic remains available. Council rejects another radical redesign before the merged Cockpit is tested with real browser evidence.

## Impeccable recommendations already completed

- One authoritative encounter and draft across Classic and Cockpit.
- Server-authoritative readiness and Review-only signing.
- Revision-aware autosave and stale-write rejection.
- Explicit failed/partial/denied/not-assessed handling.
- Seven canonical stages.
- Signed encounters read-only.
- Doctor/Owner workspace preference with Receptionist denial.
- Clickable longitudinal context.
- Responsive Cockpit shell using clinic green/teal, warm surfaces, logical properties, reduced motion, visible focus, and 44px key controls.
- Permanent static safety gate in CI.
- Permanent real API/PostgreSQL runtime gate in Security Integration.

## Remaining council-approved closure work

### Gate 1 — manual browser QA

Use `apps/web/docs/visit-cockpit-manual-qa.md`.

Required evidence:

- desktop English;
- tablet English and Arabic RTL;
- mobile English and Arabic RTL;
- keyboard-only navigation;
- 200% zoom;
- high contrast;
- reduced motion;
- save failure and retry;
- resource failure and retry;
- stale revision conflict;
- blocked Review;
- ready Review;
- signed read-only;
- Receptionist denial.

### Gate 2 — focused post-QA polish sprint

Council pre-approves only evidence-backed corrections in these boundaries:

1. critical Arabic/RTL strings, mixed-direction MRN/date display, and scroll origin;
2. hidden or clipped safety identity at named breakpoints;
3. controls below 44×44;
4. sticky elements covering focus, errors, or actions;
5. missing factual artifact status/link in Review;
6. no View all path where a context list is truncated;
7. contrast failures against WCAG AA;
8. inaccessible dialog/focus behavior if encountered in the active workflow.

Each repair must include the failing screenshot/QA ID, exact file scope, focused test, and regression boundary.

### Gate 3 — release promotion

Release promotion remains blocked until:

- Main CI is green;
- Security Integration is green;
- manual QA has no blocker/high failure;
- council verifies no patient-data loss, duplicate encounter, signing bypass, silent conflict overwrite, role bypass, or signed-record mutation;
- rollback reference is recorded.

## Rejected or deferred work

- No broad patient-shell redesign before QA evidence.
- No deletion of Classic Workspace.
- No second encounter/draft implementation.
- No client-only authorization or readiness.
- No invented clinical completion rules.
- No broad `patient-components.tsx` rewrite solely for file length.
- No global CSS cleanup that can destabilize unrelated modules.
- No autonomous AI diagnosis, prescribing, or treatment selection.
- No default-branch promotion while its divergence remains unresolved.

## Council sign-off

- Product: APPROVED — Cockpit is coherent enough for acceptance testing.
- Design: APPROVED WITH QA GATE — visual/runtime evidence remains mandatory.
- Clinical Safety: APPROVED — Review-only signing and signed immutability are preserved.
- Technology: APPROVED — shared controller and revision contract are the correct foundation.
- Security: APPROVED — server RBAC and runtime security tests remain authoritative.
- Quality: APPROVED WITH QA GATE — manual breakpoint, RTL, keyboard, and failure-state testing remains open.
- Data/AI: APPROVED — no AI autonomy or fabricated clinical content introduced.
- Operations: APPROVED — release is blocked until browser acceptance passes.

Overall verdict: ARCHITECTURE APPROVED; IMPECCABLE CLOSURE NOT COMPLETE UNTIL MANUAL QA AND EVIDENCE-BACKED POLISH PASS.