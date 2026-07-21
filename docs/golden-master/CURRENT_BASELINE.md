# Golden Master Current Baseline

## Status

- Inventory state: STARTED
- Source state: FROZEN
- Copy implementation: NOT STARTED
- Visual redesign: PROHIBITED during Golden Master construction

## Canonical source

- Repository: `eiadmaged1-bot/prij-clinic`
- Source commit: `47c39e4478c9d91231bcdf05bdbcc7c63e597660`
- Protected source branch: `baseline/prij-v1.5.3-source-freeze`
- Inventory branch: `work/golden-master-inventory`
- Historical default branch: `security/rbac-scope-enforcement` — not the Golden Master source

The source commit is the v1.5.3 acceptance checkpoint titled `Fix reproducible Playwright authentication for v1.5.3 acceptance`. The source-freeze branch must remain unchanged.

## Application architecture

The repository is a private npm monorepo with `apps/*` and `packages/*` workspaces.

Primary applications:

- `apps/web`: Next.js 15, React 19, TypeScript frontend
- `apps/api`: clinic API and Prisma persistence layer

Primary runtime commands:

- `npm run dev`: coordinated local development runtime
- `npm run dev:web`: web application
- `npm run dev:api`: API application
- `npm run build`: workspace build
- `npm run typecheck`: workspace TypeScript validation
- `npm run lint`: workspace lint validation

## Web application root

`apps/web/app/layout.tsx` installs these global providers:

1. `I18nProvider`
2. `ThemeProvider`
3. `SessionProvider`
4. `InterfaceModeProvider`

The Golden Master must preserve provider order and behavior because language direction, themes, authenticated session state, interface mode, and density affect nearly every screen.

## Shared shell

The authenticated application shell is centralized in:

- `apps/web/app/mvp-page.tsx`

The shell owns:

- authenticated route gating
- role-based route redirection
- desktop sidebar
- responsive navigation drawer
- sidebar collapse persistence
- top bar
- universal search
- account menu
- language switcher
- appearance link for administrators
- logout
- minimalistic mobile bottom navigation
- theme, density, interface-mode, and receptionist-shell CSS classes

The Golden Master must reuse or reproduce the exact shell before any individual menu is separated.

## Navigation and route authorization

Canonical navigation registry:

- `apps/web/app/navigation-registry.ts`

Canonical landing and coarse workspace authorization:

- `apps/web/lib/role-routing.ts`

Canonical landing paths:

- Owner/Admin/Super Admin: `/owner-control`
- Doctor: `/doctor`
- Reception/Receptionist: `/reception`
- Unclassified permitted role: `/dashboard`

Workspace route gates:

- `/doctor` and `/doctor/*`: Owner/Admin or Doctor
- `/reception` and `/reception/*`: Owner/Admin or Receptionist
- `/owner-control`, `/owner-control/*`, `/admin`, `/admin/*`: Owner/Admin only

Fine-grained menu visibility additionally depends on permissions from the navigation registry.

## Current product identity

Official visible name: `Dr Maged Attia Clinics`.

The source README identifies the current product line as desktop UX reconstruction and clinical workflow recovery, including:

- Doctor, Receptionist, and Owner shells
- compact tabbed patient workspace
- structured searchable clinical-history tags
- guided doctor visit workflow
- investigation favorites
- prescription shortcuts and templates
- dedicated A5 prescription printing
- medication reference and import recovery
- signed external intake receiver

## Safety and data boundaries

The Golden Master must preserve these source rules:

- Clinical assistance remains draft-only.
- Clinical output requires clinician review.
- Signed encounters require audited amendment.
- Imported medication records default to review-required states.
- The application must not autonomously diagnose, prescribe, choose doses, or finalize clinical records.
- Public browser traffic uses `/api/backend/...`.
- API port `3001` remains internal and must not be publicly exposed.
- Real patient data must not be used in public tunnel QA.

## Baseline acceptance rule

A Golden Master page is accepted only when all applicable checks pass:

- same source route and role visibility
- same information hierarchy
- same component structure
- same typography, spacing, sizing, borders, and icons
- same loading, empty, warning, error, and success states
- same desktop and responsive behavior
- same keyboard and mouse interactions
- same API contract
- same print behavior
- no new visual design decisions
- no hidden production regression

## Current known limitation of this document

This file freezes the source and shared architecture. It does not yet certify every route, component, API endpoint, database entity, print template, or responsive screenshot. Those are tracked by the remaining Golden Master inventory documents.
