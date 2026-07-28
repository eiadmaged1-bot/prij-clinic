Method: dual-agent (independent source design review, then isolated detector/runtime-evidence review); reconciled by the primary agent.

# Impeccable Doctor Patient Workspace Critique

## 1. Executive verdict

The current working-tree workspace has a credible patient-identity spine, explicit draft language, context-specific modules, and a thoughtful green-led brief. It is not yet a dependable single doctor workspace.

Two competing “current visit” systems are visible: `ClinicalInputFoundation` is rendered inside the patient file, stores data only in component state, and says it is not saved to the record; `ActiveVisitWorkspace` is a separate routed flow that owns the auditable encounter, prescriptions, investigations, follow-up, signing, and printing.

The most serious source-verified defect is completion. Persistent `Finish visit` controls call signing from any active module, while the visible missing-field gate exists only in Finish/Print. The API checks draft status, but not that UI readiness result, before signing, completing an in-room queue ticket, and deriving downstream records. This is an interface/information-safety inconsistency, not a recommendation about which clinical fields should be required.

The shell also drifts from “The Calm Clinical Workspace” through private navy/gold styling, a gradient, operational Georgia headings, 38px controls, very small metadata, repeated CSS overrides, and hidden context cells at some widths. Eight patient sections lead into ten differently named visit modules.

This critique includes uncommitted work and changes no application code. The Impeccable detector returned zero findings. No local Prij runtime was listening, so no visual, interaction, contrast, assistive-technology, or screenshot claim is runtime-verified.

## 2. Overall maturity score

**46/100 — coherent foundation, unsafe workflow joins, incomplete state hardening**

| Area | Score / 10 | Rationale |
|---|---:|---|
| Visual hierarchy | 5.5 | Strong identity; repeated bars, tiny metadata, and dense options weaken scan order. |
| Workflow efficiency | 4.0 | Direct links help experts; two visit models create context switching. |
| Clinical information safety | 3.5 | Identity locks, draft labels, void confirmation, and signed read-only are strengths; completion bypass is not. |
| Connectedness | 4.0 | Patient/encounter IDs connect some writes; history, local input, results, billing, and closure remain fragmented. |
| Responsive behaviour | 4.5 | Stacking/scroll exist; context disappears and targets shrink. |
| Accessibility | 4.0 | Native controls, focus, reduced motion exist; semantics, announcements, target size, modal behavior are incomplete. |
| State handling | 4.5 | Loading, timeout, local, offline, failed, voiding, signed exist; conflict/recovery gaps remain. |
| Design-system adherence | 4.0 | Warm surfaces remain; shell violates green/teal, sans, no-gradient, token, and 44px rules. |
| Maintainability | 3.5 | Registries/lazy modules help; large components, weak types, global listeners, duplicate CSS raise risk. |

## 3. Method, evidence, and reconciliation

- **Source-verified:** tied to current file/line evidence.
- **Detector-verified:** `detect.mjs --json "apps/web/app/patients/[id]/page.tsx"` returned `[]`.
- **Runtime/screenshot-verified:** none; no safe existing frontend, and no server was started.
- **Not performed:** login, patient-data access, DOM injection, overlay, contrast measurement, touch/screen-reader/Arabic visual testing.

Target slug: `apps-web-app-patients-id-page-tsx`; ignore list absent. Assessment A finished before Assessment B began. A first read-only A worker failed to return and was replaced; the replacement design review and isolated detector/runtime review completed independently. No critique snapshot was written because only this report was authorized.

Both assessments found split navigation, weak selected-state semantics, non-actionable retry, undersized controls, and design drift. The detector's zero count is a scanner limitation. One initial interpretation is rejected: later CSS restores signals at 768–1279px. The supported issue is `globals.css:7256-7258`, which hides the last two cells around 1280–1350px.

## 4. Strong elements to preserve

1. **Identity before action.** Name, phase/type, age, MRN, contact, blood group, allergies, and mode context are grouped (`PatientSmartIdentityBar.tsx:40-56`). Loaded patient/encounter IDs must match routes before writes (`ActiveVisitWorkspace.tsx:147-150`).
2. **Draft boundaries.** Local input says “Unsigned local draft · Not saved” (`ClinicalInputFoundation.tsx:92-95`); routed visit models unsaved/local/syncing/synced/offline/failed (`ActiveVisitWorkspace.tsx:141-189,746-752`).
3. **Deliberate voiding.** Permission wrapper, Options placement, impact, mandatory reason, busy and failure states (`ActiveVisitWorkspace.tsx:350-361,385-438`).
4. **Context disclosure.** Pregnancy, infertility, GYN, postpartum, menopause, postoperative, general modes drive identity/input (`PatientSmartIdentityBar.tsx:59-66`; `ActiveVisitWorkspace.tsx:603-680,787-798`).
5. **Locked downstream context.** Prescription/investigation creation uses active patient/encounter IDs (`PatientClinicalWorkflowPanels.tsx:11-39`).
6. **Inclusive foundations.** Visible focus, reduced motion, RTL shell, high contrast, responsive stacking, general 44px floor (`globals.css:6176-6182,6667,6691-6697,6740-6746,6939`).

## 5. Visual and design defects

### High — Repeated hierarchy obscures orientation

**Problem/where:** Back link, identity, active-record bar, actions, eight section buttons, panel, activity, completeness (`page.tsx:400-451`) precede another identity bar, ten modules, sticky actions, panel heading (`ActiveVisitWorkspace.tsx:343-452`).

**Why:** longitudinal navigation and encounter progress compete with patient/save context.

**Correction:** one compact patient/visit header and canonical visit stepper; longitudinal history/results/billing become contextual navigation.

**Acceptance:** patient, encounter, stage, save state, next action in one viewport; one primary action; deep links expose the same stage.

**Risk:** High—routes, saved links, permissions, tests.

### Medium — Approved shell contradicts design authority

`DESIGN.md` requires green/teal, Warm Ivory, operational sans, limited shadow, 8–18px radii, 44px controls, no gradients. The shell adds navy/gold, gold selection, Georgia, gradient, strong shadow, 20px radius, 38px actions (`globals.css:7121-7173,7239-7252,7439-7441`). Consolidate on shared tokens, Clinical Teal, sans, tonal surfaces, 44px. Acceptance: no patient/visit gradient/private routine palette; touch controls ≥44×44. Risk: Medium.

### Medium — Critical scan text is too small

Identity support is 10.5px; action text 11px/9.5px (`globals.css:7175-7179,7224-7225`); calendar detail 0.58rem (`clinical-input-foundation.module.css:161-166`). Use ≥12px metadata and ≥14px operational labels. At 200% zoom, no clipping/loss. Risk: Medium.

### Medium — Too many peer options

The foundation can show five lenses, chips, ten complaint groups, ten history groups, calendar, seven exams, diagrams, conditional fields (`ClinicalInputFoundation.tsx:92-129`); active visit duplicates pickers (`ActiveVisitWorkspace.tsx:711-744`). Use one authoritative component with complaint/search, recent/relevant, selected basket, taxonomy on demand. No primary stage should present >4 peers before disclosure/search; “Relevant” must mean recorded-context filter, not recommendation. Risk: High.

## 6. Workflow defects

### Critical — Finish bypasses Review readiness

**Evidence:** persistent Finish invokes `finishVisit` and disables only while busy (`ActiveVisitWorkspace.tsx:372-381`); `finishVisit` saves then completes without `requiredMissing` (`259-277`); missing calculation exists only in `FinishModule` (`683-702`); client calls `PATCH /encounters/:id/sign` (`doctor-visit.ts:53-54`); service checks draft status, then signs/completes queue/derives records without UI readiness (`encounters.service.ts:155-225`).

**Why:** signing and downstream transitions can occur without the review summary/blocking message.

**Correction:** one server-authoritative readiness/sign contract; persistent action navigates to Review; Review shows identity, sync, blockers, artifacts, downstream effects, deliberate confirmation.

**Acceptance:** no UI/API blocked path signs; identical response everywhere; idempotent; announced result; signed state read-only with amendment.

**Risk:** High—sign, queue, print, pregnancy, tags, audit.

### High — Two current-visit drafts can diverge

`workspace-module-renderer.tsx:56,69-73` renders the local foundation; it documents non-persistence (`ClinicalInputFoundation.tsx:52-95`). The page separately launches routed visit (`page.tsx:404-407`; `ActiveVisitWorkspace.tsx:459-473`), has document-wide draft capture (`page.tsx:148-164`), while routed visit owns another draft (`ActiveVisitWorkspace.tsx:141-189`).

Unify via embedding/migration; remove non-persisted prototype from routine doctor navigation until integrated. Acceptance: one draft ID/state/recovery/source; refresh and Review reproduce data; no silent fork/loss. Risk: High.

### High — Seven stages become eight sections and ten modules

`PRODUCT.md` defines seven stages; `page.tsx:70-79,409-416` has eight sections; `ActiveVisitWorkspace.tsx:45-56,367-371` has ten modules. Create one shared stage registry and keep Timeline/Results/Billing/Medications outside progress. Labels/order/Previous/Next/deep links must match docs, routes, Review, tests. Risk: High.

### High — Results, procedures, billing weakly join closure

Requests lock to encounters (`PatientClinicalWorkflowPanels.tsx:11-39`), but Finish shows counts only (`ActiveVisitWorkspace.tsx:683-707`); result review, procedures, billing handoff, owners/unresolved work are absent; billing is generic (`workspace-module-renderer.tsx:80`). Review should show factual status/owner/link without inventing clinical rules or implying notification/payment. Risk: Medium-high.

## 7. Clinical information-safety concerns

| Severity | Concern/evidence | Correction/acceptance | Risk |
|---|---|---|---|
| Critical | Completion bypass (`ActiveVisitWorkspace.tsx:259-277,372-381,683-702`; `encounters.service.ts:155-225`) | Server readiness/sign; Review confirmation | High |
| High | Divergent drafts (`workspace-module-renderer.tsx:69-73`; `ClinicalInputFoundation.tsx:52-95`) | One audited state; all visible input persists | High |
| High | Auth failure empties arrays (`page.tsx:246-259`), readiness stays false (`206`), skeleton persists (`357-365`) | Loading/denied/expired/error with retry/reauth | Medium |
| High | Related failures become empty (`page.tsx:272-319`) | Distinguish unavailable/denied/empty/not-loaded | Medium-high |
| High | Context hidden at 1280–1350 (`globals.css:7256-7258`) | Required identity plus accessible More context | Medium |
| Medium | “Retry” is text only (`ActiveVisitWorkspace.tsx:372-375,746-752`) | Alert plus working retry preserving draft | Medium |
| Medium | No conflict; local merges over server (`ActiveVisitWorkspace.tsx:141,167-169`) | Version comparison and deliberate resolution | Medium-high |
| Medium | `autosaveStatus` accepted but not rendered (`PatientSmartIdentityBar.tsx:6-13,40-56`) | Show authoritative encounter save state only | Low |
| Medium | Void modal lacks visible focus trap/Escape/return (`ActiveVisitWorkspace.tsx:385-440`) | Shared accessible modal | Medium |
| Low | Tool output suggests encoding artifacts near `page.tsx:402,405,461` | Verify UTF-8/runtime before changing | Low |

No treatment or new clinical rule is proposed.

## 8. Progressive disclosure

**Preserve:** mode-specific fields (`PatientSmartIdentityBar.tsx:59-66`); conditional menstrual/pregnancy content (`ClinicalInputFoundation.tsx:88-129`); relevant-first exam groups (`ActiveVisitWorkspace.tsx:738-744`); Options-contained void; collapsed completeness (`page.tsx:443-451`).

**Correct:** peer navigation before task choice; lenses plus every complaint category (`ClinicalInputFoundation.tsx:96-101`); `nth-last-child` hiding; triggered panels without trigger/persistence explanation; `<details>` state without restoration/deep links.

## 9. State coverage

| State | Current | Required gap closure |
|---|---|---|
| Initial/partial loading | Page/visit skeletons; staged loads | Live status; separate patient/role/module states |
| Empty | Explicit in some panels | Never conflate empty/unavailable/denied |
| API/session error | Patient retry/reauth | Per-resource recovery |
| Validation | Finish missing list | Same server contract every completion path |
| Offline/local/unsynced | Modeled in visit | Reconnect, server version, retry |
| Autosaving/saved | Two systems | Consolidate; real saved time, not render-time `new Date()` (`ActiveVisitWorkspace.tsx:751`) |
| Sync conflict | Absent | Detect server/local/both; no silent overwrite |
| Long text/zoom | Partial wrap | Names, Arabic, notes/tables at 200% |
| Many records | Timeline paginates (`page.tsx:325-333`) | 12-item truncation needs View all (`PatientClinicalWorkflowPanels.tsx:47-50`) |
| Duplicate | Timeline filters append | Expose suspected duplicates; never silently merge records |
| Interrupted | Local recovery (`ActiveVisitWorkspace.tsx:167-189`) | Recovered source/time; refresh/nav/multi-tab tests |
| Completed/historical | Encounter form read-only | Every module; signer/time/version/amendment |
| Permission denied | Some actions hidden | Explicit denied/read-only; server authoritative |

## 10. Accessibility

1. Patient buttons use visual active only (`page.tsx:409-418`); visit links lack `aria-current` (`ActiveVisitWorkspace.tsx:367-370`). Use complete tabs or navigation semantics.
2. Skeletons are inconsistently live/labelled (`page.tsx:357-365,454-456`).
3. Failed save needs focusable retry and alert.
4. Chips 38px, calendar 40px, shell actions 38px (`clinical-input-foundation.module.css:76-86,132-138`; `globals.css:7439-7441`); meet 44×44.
5. SVG points accept keyboard (`ClinicalInputFoundation.tsx:146-150`) but expose no selected/spatial semantics; use buttons/radio alternative.
6. Verify modal focus trap, Escape, description, focus return.
7. Hard-coded English and physical direction rules (`globals.css:6370-6372,7154,7188-7192`) weaken RTL; use logical properties/localization.
8. Computed contrast is unverified; require WCAG AA normal/high-contrast.

## 11. Engineering defects affecting UX

- **High:** `patient-components.tsx` is 1,843 lines; `ActiveVisitWorkspace.tsx` 858. Page owns summary, roles, data, timeline, phases, tabs, layout, QR, actions, another draft (`page.tsx:84-355`). Use typed packets/discriminated states instead of broad `Record<string, unknown>`.
- **High:** related errors return `[]` (`page.tsx:272-319`), making unavailable look like none.
- **Medium:** DOM queries/document listeners rerun with `draftFields` (`page.tsx:148-164`). Use controlled authoritative form/store.
- **Medium:** patient selectors repeat at `globals.css:6838-6878,7121-7275,7391-7444,7663-7758`. Consolidate one layer/module.
- **Medium:** summary/auth then broad resource loading (`page.tsx:209-323`). Return bounded role-safe critical packet; lazy-load noncritical modules.
- **Medium:** broad scripts exist, but focused completion/conflict/semantics/breakpoint assertions are not evident.

Refactor acceptance: typed `loading | ready | empty | denied | error`; versioned encounter/completion; no document listener; isolated module tests; named audited mutations.

## 12. Desktop persona walkthrough

An experienced doctor sees strong identity, then record bar, actions, eight sections, local “Current Visit,” and a separate ten-module visit. “History,” “Current Visit,” “Complaint,” and “Encounter” compete. Save failure cannot be retried. Persistent Finish bypasses Review.

**Outcome:** expert speed requires learning a fragmented model. Completion is the emotional valley.

## 13. Tablet persona walkthrough

At 768–1279px later rules restore context and stack identity (`globals.css:7680-7689`). At about 1280–1350px two cells are hidden. Horizontal navigation remains, and 38–40px controls miss the touch floor. Sticky layers may consume height; runtime measurement is pending.

**Acceptance:** at 768, 820, 1024, 1280, 1366, required identity stays visible; stage is clear; targets ≥44px; sticky regions never obscure focus/error.

## 14. Mobile doctor persona walkthrough

Actions stack/tabs scroll (`globals.css:7693-7752`), but eight sections plus ten modules are difficult to discover. The bottom row is non-wrapping (`globals.css:6503-6505`) and may overflow; runtime verification is required. Finish is thumb-reachable but too prominent. Multi-tab conflict is absent.

**Acceptance:** patient, stage, save state, continue, Review, deliberate completion work without page overflow, hidden actions, or interruption loss.

## 15. Arabic RTL walkthrough

Source-only. The shell mirrors direction/sidebar (`globals.css:6673-6675,6740-6746`), but reviewed strings are mostly English and relevant CSS uses physical directions. Locale defaults do not prove Arabic date/digit or mixed-direction MRN quality. Horizontal navigation needs RTL scroll-origin testing.

**Acceptance:** same conceptual order; predictable mirroring; readable MRN; visual/focus order agree; logical menu anchors; localized strings; no 200% clipping.

## 16. Exact reference map

| File/component | Responsibility | Evidence |
|---|---|---|
| `apps/web/app/patients/[id]/page.tsx` / `PatientFilePage` | Loading, roles, tabs, related data, draft | `84-355,357-465` |
| `patient-components.tsx` | Context, overview, alerts, history/legacy | 1,843 lines; `122-159,301-349,463-538,784-1075` |
| `panel-components.tsx` | History, GYN, infertility, ultrasound, investigations | mixed large panels; save near `683` |
| `workspace-module-renderer.tsx` | Module registry | `45-91`; local visit `69-73` |
| `ActiveVisitWorkspace.tsx` | Authoritative visit, writes, finish, void, recovery | `119-277,343-457,683-752` |
| `ClinicalInputFoundation.tsx` | Frontend-only structured prototype | `52-150` |
| `clinical-input-foundation.module.css` | Prototype density/responsive | `76-86,132-166,216-250` |
| `PatientClinicalWorkflowPanels.tsx` | Encounter-locked request/prescription | `11-50` |
| `PatientSmartIdentityBar.tsx` | Patient/context identity | `14-66,82-103` |
| `apps/web/app/globals.css` | Shell, active visit, responsive/RTL | `6143-6379,6832-6878,7121-7275,7391-7758` |
| `apps/web/lib/doctor-visit.ts` | Visit API client | `18-55` |
| `apps/api/src/encounters/encounters.service.ts` | Signing/downstream transitions | `155-225` |
| `encounters.controller.ts` | Sign/void routes/permissions | `33-48` |
| `doctor-visit.service.ts`, `dto.ts` | Packet/update contract | current working-tree contract |

## 17. Ranked remediation backlog

| Rank | Severity | Problem/correction | Acceptance | Risk |
|---:|---|---|---|---|
| 1 | Critical | One server readiness/sign gate; persistent Review only | No blocked path signs; confirmation/idempotency | High |
| 2 | High | Unify local foundation and routed visit | One draft/state/recovery; refresh/Review reproduce input | High |
| 3 | High | Shared canonical seven-stage registry | Labels/order/progress/deep links match | High |
| 4 | High | Discriminated auth/role state | Failure never becomes endless skeleton | Medium |
| 5 | High | Per-resource status | Unavailable never renders as none | Medium-high |
| 6 | High | Required identity plus More context | Required set visible at named widths | Medium |
| 7 | Medium | Real retry and sync conflicts | Retry works; no silent overwrite; announced | Medium-high |
| 8 | Medium | Proper active navigation semantics | Keyboard/screen reader announces selection | Low-medium |
| 9 | Medium | Consolidate tokens/44px shell | No gradient/private selection; sans; 44px | Medium |
| 10 | Medium | Operational Review checklist | Artifact status/owner/link, not counts | Medium-high |
| 11 | Medium | Typed controlled form/hooks | No global listener; versioned packets; isolated tests | High |
| 12 | Low | UTF-8/localization hardening | No mojibake; Arabic strings covered | Low-medium |

## 18. Path A — conservative improvement

Preserve routes/layout while fixing safety:

1. Replace persistent Finish with primary Review.
2. Enforce one server readiness/sign response.
3. Route Current Visit to authoritative visit; keep local foundation out of routine use until integrated.
4. Add role/resource errors, save retry, sync conflict.
5. Add `aria-current`, live status, modal focus behavior, 44px targets.
6. Consolidate shell CSS and restore documented tokens.

**Result:** lower delivery risk and substantially safer behavior, though longitudinal/visit separation remains imperfect.

## 19. Path B — radical but clinically safe redesign

Create one **Visit Cockpit**:

- compact sticky identity/encounter/sync header;
- canonical seven-stage rail;
- longitudinal context pane for history, results, medications, pregnancy/GYN/fertility, ultrasound, plans;
- one structured-input system with relevant/recent/search and visible selected basket;
- Review as sole completion gateway, showing artifacts, drafts, owners, handoffs, print, server blockers;
- tablet collapsible context and mobile stage selector/bottom Review.

Preserve product truth, permissions, audit, locks, signed immutability, route aliases. No AI autonomy, treatment recommendation, invented fields, silent merge, or client-only authorization.

## 20. Recommended first implementation sprint

**Goal: make completion and draft ownership unambiguous before visual redesign.**

1. Add typed `VisitCompletionReadiness` to API and use for Review/sign.
2. Keep one persistent primary `Review visit`; Finish/Print stays in Review.
3. Reject blocked signing server-side with structured, non-clinical UI reasons.
4. Route Current Visit to active visit/start-resume; do not delete uncommitted foundation.
5. Add role-context error/retry and working save retry.
6. Add focused automated and manual viewport/RTL tests.

**Exact acceptance criteria**

- One routine current-visit editor, draft ID, save state, recovery path.
- One primary completion-related action before Review.
- API and UI reject the identical blocked readiness result.
- Review shows patient, encounter/status, author, last sync, missing/recommended states, linked artifacts, impact.
- Save failure preserves/retries draft.
- Auth/role failure never renders indefinitely.
- One signing activation yields one signed transition, applicable queue transition, expected audits; repeat is safe.
- Signed/historical view is explicit with permitted amendment only.
- No treatment guidance, AI autonomy, real data, secrets, or unaudited write.

## 21. Required automated tests

### API/integration

- Readiness/sign share ready/blocked demo fixtures; blocked cannot sign.
- Sign idempotency and audit/queue transaction boundaries.
- Save/sign version check; stale returns conflict.
- Server roles for update/sign/void/prescription/investigation/amendment.
- Signed rejects normal update; audited amendment only.

### Web/component

- Persistent bar has Review, not direct Finish.
- Review consumes server readiness, not duplicate local logic.
- Save error announces; retry reissues mutation.
- Recovery shows source/time and cannot silently overwrite newer server state.
- Role states: loading, denied, expired, error.
- Resource error is not empty.
- Active navigation announced.
- Dialog traps/restores focus and handles Escape policy.
- Required identity at 390, 768, 820, 1024, 1280, 1350, 1440px.
- Touch ≥44×44; English/Arabic long strings and 200% zoom do not overflow.

### End-to-end

- Start/resume → complaint/history → examination → prescription/request → follow-up → Review → sign.
- Refresh, navigate, offline, second-tab interruption recover/resolve deliberately.
- Complete/print only after Review.
- Signed history read-only with audited amendment.
- Reception denied doctor flow; doctor denied owner diagnostics; API enforces denial.

## 22. Required manual screenshot tests

Use demo data only; record viewport, language/direction, theme, density, browser, zoom, fixture, state.

| View | States |
|---|---|
| 1440×900 LTR | Identity, editor, save failed, Review blocked/ready, signed |
| 1280×800 LTR | Required context; no silent hiding |
| 1024×768 landscape | Wrapping, stage nav, keyboard, sticky clearance |
| 820×1180 portrait | Context disclosure, dialog, long error |
| 390×844 mobile | One-handed actions, stage scroll, no overflow |
| 320×568 mobile | Long name/MRN, stacked actions |
| 1440×900 RTL | Identity, stages, Review, dialog, mixed MRN |
| 820×1180 RTL | Anchoring, scroll origin, focus order |
| High contrast | Focus, selected, warning, error, disabled |
| Reduced motion | Drawer/dialog/sticky transitions |

No screenshots were captured during this critique.

## 23. Files likely to change

Future implementation candidates:

- `apps/web/components/clinic/ActiveVisitWorkspace.tsx`
- `apps/web/lib/doctor-visit.ts`
- `apps/api/src/encounters/encounters.controller.ts`
- `apps/api/src/encounters/encounters.service.ts`
- `apps/api/src/doctor-visit/doctor-visit.service.ts`
- `apps/api/src/doctor-visit/dto.ts`
- `apps/web/app/patients/[id]/page.tsx`
- `apps/web/app/patients/[id]/workspace-module-renderer.tsx`
- `apps/web/components/patients/PatientSmartIdentityBar.tsx`
- `ClinicalInputFoundation.tsx` only when integrating, never discarding, its work
- focused patient/visit styles, shared types, focused tests

## 24. Risks and regression boundaries

1. Navigation must not redefine clinical meaning.
2. Server authorization, validation, versioning, audit, transactions stay authoritative.
3. Preserve uncommitted clinical-input work.
4. Preserve signed immutability/audited amendment.
5. Preserve patient/encounter locks for prescription, investigation, ultrasound, follow-up, print.
6. Preserve role separation; hidden UI is not authorization.
7. Keep missing, none, unavailable, denied, not-loaded distinct.
8. Migrate/retain drafts; never silently discard.
9. Preserve dedicated print without app navigation.
10. Test breakpoints and RTL as contracts.

## 25. Items that must not be changed

- No real patient data, credentials, environment values, secrets, keys, tokens, private paths.
- No treatment recommendation, autonomous diagnosis/prescribing, dose selection, fabricated claim, AI bypass.
- No weakening RBAC, consent, audit, privacy, backups, locks, signed immutability.
- No deletion/overwrite of existing uncommitted application, API, test, medication, recovery, workflow, database, styling work.
- No `.worktrees/`, `local-reference/`, `reference/`, medication scripts, recovery/workflow scripts, unrelated `package.json` changes.
- No pink, decorative gradient, generic AI dashboard, oversized cards, excessive shadow.
- No implementation during critique.

## 26. Design-director questions

1. Is patient-file Current Visit replacement or experiment?
2. Which context fields must always remain visible?
3. Is navy/gold/Georgia approved, or does `DESIGN.md` remain authoritative?
4. Which recorded states block signing, and where is the single contract?
5. Should result review/billing handoff appear as factual Review status only?

## 27. Impeccable run notes

- Target: `apps/web/app/patients/[id]/page.tsx`
- Slug: `apps-web-app-patients-id-page-tsx`
- Mode/context: Operate; `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`
- Ignore list: absent
- Independence: maintained
- Assessment A: replacement completed after first read-only worker failed to return
- Assessment B: isolated detector/runtime pass
- CLI detector: completed, zero findings
- Browser/screenshots: unavailable/none
- Overlay: skipped, not claimed
- Live server/temp browser files: not started/none
- Application files changed: none
- Report verification and Git disposition: task close-out
