# Prij Golden Master Inventory

## Goal

Create an identical, editable Golden Master of the frozen Prij v1.5.3 application before splitting and upgrading individual menus.

## Source of truth

- Frozen branch: `baseline/prij-v1.5.3-source-freeze`
- Frozen commit: `47c39e4478c9d91231bcdf05bdbcc7c63e597660`
- Inventory branch: `work/golden-master-inventory`

## Current phase

```text
Phase 1 — Source freeze                 COMPLETE
Phase 2 — Repository architecture map   COMPLETE
Phase 3 — Component inventory           COMPLETE
Phase 4 — API contract inventory        COMPLETE
Phase 5 — Module boundary contract       COMPLETE
Phase 6 — Acceptance and capture plan    COMPLETE
Phase 7 — Local rendered baseline        MANUAL CHECKPOINT REQUIRED
Phase 8 — Identical Golden Master build  NOT STARTED
Phase 9 — Menu-by-menu upgrades          NOT STARTED
Phase 10 — Integration/release           NOT STARTED
```

## Documents

1. [`CURRENT_BASELINE.md`](./CURRENT_BASELINE.md)
   - Exact source, stack, global providers, safety boundaries and baseline rules.

2. [`ROUTE_INVENTORY.md`](./ROUTE_INVENTORY.md)
   - Routes, dynamic patient/visit routes, patient tabs and print surfaces.

3. [`ROLE_PERMISSION_MATRIX.md`](./ROLE_PERMISSION_MATRIX.md)
   - Role landings, route access and navigation visibility.

4. [`COMPONENT_INVENTORY.md`](./COMPONENT_INVENTORY.md)
   - Shared core, page/module components, ownership and split rules.

5. [`API_CONTRACT_INVENTORY.md`](./API_CONTRACT_INVENTORY.md)
   - Security/transport rules and controller-level domain endpoint contracts.

6. [`MODULE_BOUNDARIES.md`](./MODULE_BOUNDARIES.md)
   - Shared packages, menu ownership, dependency direction and integration events.

7. [`GOLDEN_MASTER_ACCEPTANCE_CHECKLIST.md`](./GOLDEN_MASTER_ACCEPTANCE_CHECKLIST.md)
   - Visual, behavioral, responsive, RTL, print, security and workflow approval gate.

8. [`MANUAL_CAPTURE_RUNBOOK.md`](./MANUAL_CAPTURE_RUNBOOK.md)
   - Safe local startup, configuration recording and initial screenshot checkpoint.

9. [`SCREENSHOT_MANIFEST.md`](./SCREENSHOT_MANIFEST.md)
   - Evidence folders, filenames, routes, states, roles, viewports and privacy labels.

## Non-negotiable constraints

- No redesign before Golden Master approval.
- No generic replacement of real components/icons.
- No fake clinical records for screenshots.
- No production-branch changes.
- No database seed/cleanup for visual capture.
- No PHI/PII, credentials, cookies or secrets in evidence.
- Role and permission behavior must match the backend.
- Clinical write workflows require explicit patient/encounter context.
- AI remains assistive, draft-only, source-aware and doctor-approved.
- Print routes are first-class product surfaces.

## Manual checkpoint

The next required evidence is the seven-image Checkpoint A from `MANUAL_CAPTURE_RUNBOOK.md` plus safe environment/branch metadata. It confirms the correct source and active theme before any Golden Master implementation begins.
