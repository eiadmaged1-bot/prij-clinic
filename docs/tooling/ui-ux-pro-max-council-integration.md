# UI/UX Pro Max — PRIJ Harmony Council Integration

Status: **APPROVED WITH GUARDRAILS**  
Review date: **2026-07-30**  
Upstream: `nextlevelbuilder/ui-ux-pro-max-skill`  
Approved CLI version: **2.5.0**  
Reviewed upstream commit: `4857a2c5ef989794751a0f66b8545a4a49566286`

## Council decision

UI/UX Pro Max may be used as a repository-local development assistant for UI research, design-system exploration, layout refinement, responsive behavior, accessibility review, typography, visual hierarchy, component ergonomics, and dashboard/chart recommendations.

It is **not** a clinical authority, product owner, autonomous redesign engine, or replacement for PRIJ's established design and safety contracts.

## Authority order

When recommendations conflict, use this order:

1. Clinical safety, privacy, RBAC, auditability, and signed-record integrity.
2. PRIJ product requirements and approved clinical workflows.
3. `apps/web/PRODUCT.md`, `apps/web/DESIGN.md`, and `.impeccable/design.json`.
4. Existing shared components, tokens, bilingual/RTL contracts, and accessibility gates.
5. UI/UX Pro Max recommendations.

The skill must never silently override a higher-authority rule.

## Council review

### Product and Design

**Approved.** The skill can broaden pattern exploration and improve density, hierarchy, responsive behavior, touch targets, keyboard usability, contrast, and consistency. Recommendations must be adapted to the Calm Clinical Workspace direction rather than pasted blindly.

### Clinical Safety

**Approved with strict limitation.** The skill must not define clinical fields, diagnostic logic, alerts, severity rules, medication behavior, signing requirements, encounter state, or medical terminology. Any UI change that alters clinical meaning requires separate clinical review.

### Security and Privacy

**Approved for local development only.** Do not provide real patient data, credentials, tokens, production URLs, private logs, or identifiable screenshots to the skill. It is not a production dependency and receives no runtime access to the clinic application or database.

### Engineering

**Approved as an opt-in developer tool.** Installation is pinned and isolated from the application dependency graph. The integration does not alter API behavior, database schema, migrations, production bundles, runtime configuration, or package lockfiles.

### Quality

**Approved subject to existing gates.** Generated or revised UI must still pass the relevant typecheck, build, contract tests, Playwright/browser QA, Arabic RTL checks, keyboard checks, zoom checks, reduced-motion checks, and screenshot review.

## Why version 2.5.0 is pinned

At the time of review, the upstream GitHub release page identified v2.5.0 as the latest stable release, while npm exposed newer 2.11.x builds with release and licensing metadata that had not yet been reconciled against the repository state. The council therefore selected the stable reviewed release instead of floating `latest`.

Upgrading the pinned version requires a focused review of:

- release notes and source changes;
- generated file paths and overwrite behavior;
- license metadata;
- dependency and lifecycle-script changes;
- changes to prompts, rules, or external-network behavior.

## Installation

From the repository root on Windows PowerShell:

```powershell
.\scripts\install-ui-ux-pro-max.ps1
```

Install only one assistant target:

```powershell
.\scripts\install-ui-ux-pro-max.ps1 -Target codex
.\scripts\install-ui-ux-pro-max.ps1 -Target claude
```

Regenerate an existing installation only after reviewing local changes:

```powershell
.\scripts\install-ui-ux-pro-max.ps1 -Force
```

Expected discovery files:

- Codex: `.agents/skills/ui-ux-pro-max/SKILL.md`
- Claude Code: `.claude/skills/ui-ux-pro-max/SKILL.md`

Python 3, Node.js, and npm are required. Restart the coding assistant after installation.

## Required usage pattern

Before accepting a recommendation:

1. State the exact PRIJ screen, user role, clinical context, and viewport.
2. Ask for recommendations within the existing PRIJ design authority and component system.
3. Reject decorative patterns that reduce clarity, density, speed, contrast, or clinical certainty.
4. Preserve English/Arabic parity and RTL behavior.
5. Implement through shared components and tokens where possible.
6. Validate in real browser states with synthetic data.
7. Escalate clinical, security, architectural, or workflow changes to the relevant council lead.

## Prohibited uses

- Generating or changing medical decision rules.
- Inventing clinical terminology, thresholds, or alert severity.
- Replacing explicit unavailable/unknown/denied states with empty UI.
- Weakening Review-only signing, revision checks, audit trails, permissions, or read-only states.
- Sending real patient information or secrets to external tools.
- Applying a full visual redesign without council review and browser evidence.
- Treating generated output as automatically approved production code.

## Council verdict

- Product/Design: **APPROVED**
- Clinical Safety: **APPROVED WITH LIMITS**
- Security/Privacy: **APPROVED WITH LIMITS**
- Engineering: **APPROVED**
- Quality: **APPROVED WITH VALIDATION GATE**

**Final verdict: APPROVED for controlled repository-local use.**
