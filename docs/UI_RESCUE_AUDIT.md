# Premium UI Rescue Audit

Date: 2026-06-30
Branch: `leap/f-premium-ui-theme-rescue`

This audit was created before editing UI files for the Premium UI Rescue sprint. It uses only local code inspection and existing test results.

## Baseline Verification

- `git diff --check`: passed before edits.
- `npm run prisma:repair`: passed.
- `npm run prisma:seed`: passed with demo-only data.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Local tests passed after running the built web server for UI checks.
- `npm run test:staging:smoke`: present but not runnable as local baseline because it requires `APP_ENV=staging`.

## Pages With Excessive Space

- `Dashboard`: theme-specific portal branches use large hero and tile layouts that can feel like launch pages instead of daily clinic operations.
- `Patient file`: the top action panel plus pregnancy dating card plus tabs can push the actual patient work below the fold.
- `Admin`: service catalog, module cards, and audit viewer share one long page; repeated large cards increase scroll.
- Generic MVP pages (`appointments`, `calendar`, `queue`, `encounters`, `investigations`, `reports`, `consents`, `ai-drafts`) use the same two-column feature/demo-record pattern, which creates unrelated space on workflow pages.

## Pages With Unrelated Cards

- Generic MVP pages show a left "focus" card and a right "demo records" card even when the page should be a focused work queue.
- `Dashboard` mixes session/account details with operational quick actions; this is useful but reads like a developer demo surface.
- `Admin` includes planned/future modules near active service and audit work.

## Duplicated Navigation Or Tabs

- The shell sidebar is shared, but `Dashboard` still has theme-specific app-launcher and owner-tab branches.
- `PatientActionPanel` has its own action strip separate from `patientTabRegistry`; this is acceptable as quick actions but visually competes with patient tabs.
- Topbar includes Dashboard, Accounts, Logout, and Home actions while sidebar already includes Dashboard/Admin destinations.

## Theme Inconsistency

- Existing theme IDs are `clinic-premium`, `medicolize-portal`, `incision-portal`, `minimal-clean`, `compact-operations`.
- Requested IDs are `luxury-clinic`, `medicolize-portal`, `incision-clean`, `compact-operations`, `senior-doctor-large`, `dark-navy`.
- `dark-navy` CSS exists, but the theme provider does not expose it.
- `senior-doctor-large` and `magnified` density are missing.
- Theme metadata is split between `theme.tsx`, `globals.css`, `admin/appearance`, and dashboard branches instead of one registry.

## Missing Important Tabs Per Theme

- Patient tabs are source-driven by `patientTabRegistry`, which is good.
- Required tabs missing by exact label: `Queue`, `Gynecology`, `Files`.
- Required concepts partially present under alternate labels: `Reports` doubles as file/report records; `AI Drafts` and `Protocol Atlas` are separate, not a combined patient-scoped snapshot tab.
- Permission-filtered tabs can disappear for non-clinical roles; this is correct for restricted tools but should not be theme-driven.

## Tabs With No Icons

- Existing patient tabs use `ThreeDMedicalIcon`.
- Icon coverage is too small for the requested module list; many modules reuse generic `ai`, `prescription`, `reports`, or `files` icons.
- Future/placeholder modules such as WhatsApp, Inventory, Analytics, Backup/Restore, Security, and Support do not have dedicated icon mappings.

## Developer Text Risks

- Generic pages still display `V0.1`, `Demo/local only`, and `AI disabled` broadly. Safety wording is required, but the product should use polished labels such as `Local Demo Mode` instead of version/developer style language.
- `MvpPage` keeps internal display keys and endpoint-driven loading patterns in UI architecture, though normal visible labels are mostly friendly.
- Admin audit entries render raw action strings with underscores replaced; these can still feel system-like.

## Layout Components To Unify

- `AppShell` should be split from `mvp-page.tsx` into explicit shell components:
  - `AppShell`
  - `PremiumSidebar`
  - `PremiumTopbar`
  - `PatientSearchCommand`
  - `RoleAwareNav`
  - `ThemeDensityControls`
  - `UserSessionBadge`
- Patient file should be split into:
  - `PatientWorkspaceShell`
  - `PatientHeader`
  - `PatientTabs`
  - `PatientTimelineRail`
  - `PatientQuickActions`
  - `PatientContextBar`

## Risk Areas

- RBAC and admin route hiding must stay aligned with API protections.
- Patient tabs must remain theme-independent.
- Density changes must be CSS-variable driven to avoid re-render lag and route loss.
- No new clinical logic, AI calls, payment gateway behavior, migrations, or real patient data should be added.
- UI tests currently rely on source-string checks, so renamed themes need compatibility aliases or test updates.
