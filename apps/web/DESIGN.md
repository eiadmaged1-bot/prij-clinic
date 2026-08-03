---
name: "Prij Clinic"
description: "A calm, role-based clinical workspace for safe daily OB/GYN operations."
colors:
  deep-clinic-green: "#16302c"
  deep-clinic-green-raised: "#1e3f38"
  clinical-teal: "#2f6f62"
  clinical-teal-strong: "#087f7b"
  clinical-teal-soft: "#e4f0ec"
  warm-ivory: "#faf7f2"
  surface: "#ffffff"
  surface-muted: "#f3efe6"
  text: "#1b2624"
  text-muted: "#6e7c77"
  border: "#e6e0d4"
  border-strong: "#d8d0c0"
  reserved-terracotta: "#c6714b"
  success: "#3f8f6d"
  warning: "#c98a2c"
  danger: "#b5484a"
  cockpit-terracotta-soft: "#e4b69f"
  cockpit-terracotta-ink: "#7a3925"
  cockpit-teal-deep: "#19685f"
  cockpit-border-muted: "#dfe6e4"
  cockpit-teal-border: "#b9d9d2"
  cockpit-success-strong: "#21815e"
  cockpit-neutral: "#83918d"
  cockpit-danger-strong: "#b13a2d"
  cockpit-warning-strong: "#a26a1e"
  cockpit-surface-soft: "#f7faf9"
  cockpit-surface-subtle: "#f8faf9"
  cockpit-terracotta-bright: "#c45c35"
  cockpit-warning-border: "#bd8a2c"
  cockpit-warning-surface: "#fff8e8"
  cockpit-warning-ink: "#725019"
  cockpit-teal-alt: "#195f55"
  cockpit-success-deep: "#1e7557"
  cockpit-danger-deep: "#a23b2c"
  cockpit-warning-deep: "#94641d"
typography:
  display:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontWeight: 700
    lineHeight: 1.08
  headline:
    fontFamily: "'IBM Plex Sans', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 2vw, 2rem)"
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'IBM Plex Sans', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 750
    lineHeight: 1.35
  mono:
    fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
  cockpit-display:
    fontSize: "clamp(1.45rem, 1.8vw, 1.8rem)"
  cockpit-title-lg:
    fontSize: "1.5rem"
  cockpit-title-sm:
    fontSize: "1.12rem"
  cockpit-body-sm:
    fontSize: "0.875rem"
  cockpit-label-md:
    fontSize: "0.84rem"
  cockpit-label:
    fontSize: "0.82rem"
  cockpit-meta-lg:
    fontSize: "0.8125rem"
  cockpit-meta:
    fontSize: "0.8rem"
  cockpit-micro:
    fontSize: "0.75rem"
rounded:
  sm: "8px"
  md: "12px"
  lg: "18px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.clinical-teal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "0.68rem 0.95rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.deep-clinic-green-raised}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "0.68rem 0.95rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0.68rem 0.95rem"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0.82rem 0.95rem"
    height: "46px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  tab-active:
    backgroundColor: "{colors.clinical-teal-soft}"
    textColor: "{colors.deep-clinic-green-raised}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.md}"
  status-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.62rem"
---

# Design System: Prij Clinic

## Overview

**Creative North Star: "The Calm Clinical Workspace"**

Prij Clinic feels like a composed clinical workroom: warm enough for sustained daily use, precise enough for sensitive records, and quiet enough that patient identity, workflow state, and the next safe action remain dominant. The system is warm, restrained, trustworthy, operational, and quietly premium. Its authority comes from disciplined information hierarchy and dependable role-based workflows rather than decoration.

Interfaces are compact, symmetrical, task-focused, and clinically readable. The incumbent Prij Heritage language is the normative visual authority: Warm Ivory grounds the product; Deep Clinic Green structures navigation; Clinical Teal leads primary actions and active states; white surfaces organize work; Reserved Terracotta appears only as a limited semantic attention accent. Optional legacy appearance variants in the source are not the default design authority for new work.

The product must not drift toward pink women's-health clichés, bright gradients, decorative color, oversized cards, excessive shadows, or generic AI-dashboard styling. AI-assisted areas belong inside the same sober clinical system and must visibly communicate draft and review status.

**Key Characteristics:**

- Warm Ivory canvas with white operational surfaces
- Deep Clinic Green navigation and Clinical Teal interaction hierarchy
- Compact, symmetrical 12-column desktop composition
- Light borders and low, ambient elevation
- Role-specific navigation and patient-first context
- Responsive English LTR and Arabic RTL behavior
- Explicit semantic states that never depend on color alone

## Colors

The palette is warm-neutral and green-led. Green and teal express structure, action, and active state; semantic colors communicate status; terracotta is deliberately scarce.

### Primary

- **Deep Clinic Green:** anchors the sidebar, high-authority navigation, and the darkest structural surfaces.
- **Clinical Teal:** leads primary actions, selected controls, focus treatments, progress, and active workflow states.
- **Soft Clinical Teal:** provides quiet selected and contextual backgrounds without competing with clinical content.

### Secondary

- **Reserved Terracotta:** is limited to selected warnings, attention states, or rare owner/premium emphasis where a semantic distinction is necessary. It is not a dominant brand color and must not replace Clinical Teal for routine primary actions.

### Neutral

- **Warm Ivory:** is the principal application background tone.
- **Clinical White:** holds cards, inputs, tables, and reading surfaces.
- **Warm Surface:** separates secondary regions through tonal layering rather than heavier shadow.
- **Clinical Ink:** is the principal text color.
- **Muted Clinical Gray:** supports metadata and secondary explanations while preserving readable contrast.
- **Warm Border:** separates controls and surfaces with low visual noise.

### Semantic

- **Success Green:** confirms completed or safe states.
- **Warning Ochre:** communicates caution or review-needed states.
- **Danger Red:** communicates destructive, invalid, critical, or blocked states.

**The Green-Led Action Rule.** Deep Clinic Green and Clinical Teal own routine primary actions and active states.

**The Reserved Terracotta Rule.** Terracotta is a limited semantic accent, never the dominant brand color and never decorative fill.

**The Redundant Safety Signal Rule.** A safety-critical state always pairs color with a label, message, icon, status text, or structural cue.

### Cockpit Semantic Extension

The improved Doctor Cockpit uses documented, narrowly scoped tonal variants for compact status, warning, safety, and contextual surfaces. These variants extend the same green-led Prij Heritage theme; they do not replace Classic colors or create a second brand.

## Typography

**Display Font:** Fraunces (with Georgia and Times New Roman fallbacks)

**Body Font:** Inter and IBM Plex Sans (with system sans-serif fallbacks)

**Label/Mono Font:** IBM Plex Mono (with platform monospace fallbacks)

**Character:** The typography combines a restrained editorial note in selective heritage moments with highly legible sans-serif type for operational work. Clinical screens favor compact sans-serif hierarchy; monospace is reserved for identifiers and technical/reference values where alignment helps.

### Hierarchy

- **Display** (700, context-dependent, 1.08): use sparingly for heritage or entry moments, not routine operational page headings.
- **Headline** (800, `clamp(1.45rem, 2vw, 2rem)`, 1.15): page and patient-context titles.
- **Title** (800, about `1rem–1.1rem`, compact line-height): panels, cards, workflow groups, and table regions.
- **Body** (400, `1rem`, 1.5): instructions, clinical summaries, and operational content.
- **Label** (750, `0.92rem`, compact): form labels, statuses, controls, and dense metadata.

**The Operational Sans Rule.** Patient care and clinic-day surfaces use the sans-serif hierarchy; editorial display type never reduces scan speed or competes with patient identity.

**The Plain Clinical Language Rule.** Labels describe the user's task or record state, never internal endpoints, schemas, raw JSON, or developer terminology.

**The Cockpit Compact Type Rule.** The improved Doctor Cockpit may use the documented compact metadata and label steps to keep dense clinical context readable. Classic typography remains unchanged.

## Layout

Desktop workspaces use a sidebar-and-content shell. The sidebar targets 240–260px and the main content uses a strict 12-column grid with a maximum width of 1600px. The core spacing rhythm is 4, 8, 12, 16, 24, and 32px. Operational cards are compact, equal-height within comparable rows, and aligned to a symmetrical grid.

High-frequency pages favor dense scan paths, visible patient identity, compact KPI rows, tables, tabs, split panes, and step-based workflows. A 7/5 split supports investigation catalog and basket work; a 3/9 split supports guideline table-of-contents and reading content. These ratios are task-specific applications of the shared grid, not universal page templates.

At tablet and mobile widths, multi-column content stacks into one column, the sidebar becomes a closed-by-default drawer, navigation closes after selection, touch targets retain a usable minimum, and horizontal overflow is prevented. Arabic uses RTL text flow and mirrored drawer placement while preserving the shell's conceptual order and familiar control placement. English remains LTR.

**The Patient Context Rule.** Patient identity and visit state remain visually locked before any clinical write or review action.

**The Compact, Not Cramped Rule.** Reduce empty space and repeated prose before reducing type legibility, touch size, or state clarity.

**The Stable Direction Rule.** Language direction may mirror flow, but it must not rearrange the product's mental model, icon meaning, or role workflow.

## Elevation & Depth

Depth is lightly layered and mostly ambient. White cards sit over Warm Ivory or warm-muted surfaces with subtle borders and low warm shadows. Medium elevation is reserved for menus, dialogs, drawers, or temporarily raised interactive surfaces. Hover movement is restrained to a one-pixel lift where already implemented. Heavy glow, glass effects, and stacked shadow decoration do not belong in routine clinic screens.

### Shadow Vocabulary

- **Warm Low:** `0 1px 2px rgb(22 48 44 / 6%), 0 1px 1px rgb(22 48 44 / 4%)` for cards and resting operational surfaces.
- **Warm Medium:** `0 8px 20px rgb(22 48 44 / 8%), 0 2px 6px rgb(22 48 44 / 5%)` for menus and raised contextual surfaces.
- **Warm High:** `0 24px 48px rgb(22 48 44 / 14%), 0 6px 16px rgb(22 48 44 / 8%)` for modal or overlay layers only.

**The Ambient Depth Rule.** Borders and tonal surfaces establish hierarchy first; shadows clarify actual elevation rather than decorate the page.

## Shapes

The system uses gently rounded rectangles: 8px for controls and navigation items, 12px for medium containers, and 18px for prominent cards and patient-context surfaces. Pills are reserved for badges, compact status chips, and short filters. Shapes stay symmetrical and predictable; arbitrary corner variation and oversized soft cards weaken the operational character.

**The Role-Before-Radius Rule.** Radius communicates component type and containment; it is not a decorative scale for making every surface feel softer.

## Components

Components are compact, confident, and task-focused. Their states are explicit, keyboard-visible, and readable in both language directions.

### Buttons

- **Shape:** gently rounded controls with an 8px radius and a minimum 44px interactive height.
- **Primary:** Clinical Teal background, white text, strong label weight, and compact horizontal padding.
- **Hover / Focus:** deepen toward clinic green, use at most a subtle one-pixel lift, and retain a visible teal focus ring.
- **Secondary:** white or warm-neutral surface with a clear border and Clinical Ink text.
- **Danger:** use Danger Red with an explicit destructive label; do not rely on red alone.

### Chips

- **Style:** compact pill shape with a border, white or semantic-soft background, and concise high-weight text.
- **State:** selected, warning, success, and review states include text or icon cues in addition to color.

### Cards / Containers

- **Corner Style:** 12–18px depending on hierarchy.
- **Background:** Clinical White over Warm Ivory or Warm Surface.
- **Shadow Strategy:** Warm Low at rest; stronger elevation only for temporary raised layers.
- **Border:** a one-pixel Warm Border is the default separator.
- **Internal Padding:** generally 16px on operational cards, with density-aware reductions that preserve readability.

### Inputs / Fields

- **Style:** white background, one-pixel border, 8px radius, strong label above, and approximately 46px default height.
- **Focus:** Clinical Teal border plus a visible, low-opacity focus ring.
- **Error / Disabled:** pair semantic color with clear text and preserve readable contrast; disabled fields retain legible labels and an unmistakable inactive state.

### Navigation

Desktop navigation uses a Deep Clinic Green vertical sidebar with grouped labels, compact items, and a small teal active indicator. Hover and active states use restrained tonal changes. Tablet and mobile navigation uses a closed-by-default drawer with an explicit close action and mirrored placement in RTL. Reception, doctor, and owner/admin navigation remains role-specific.

### Tabs and Segmented Controls

Tabs are compact bordered controls. Active tabs use Soft Clinical Teal, Deep Clinic Green text, and a clear border; `aria-selected` or `aria-pressed` preserves state beyond color. Long tab sets wrap or scroll safely rather than compressing labels below legibility.

### Patient Identity Bar

The patient identity bar is a prominent but compact white surface containing name, MRN, permitted metadata, badges, visit state, and relevant actions. It remains visible or contextually persistent before clinical writes and must never be replaced by a generic page hero.

### Clinical Stepper

The seven-step doctor visit is rendered as an explicit progress sequence. The active and completed steps use both border/state treatment and structural position. On smaller screens, the sequence stacks without horizontal overflow and preserves Previous, Next, Save, and review semantics.

### Data Tables

Tables use logical text alignment, warm borders, compact 12px cell padding, readable headers, and horizontal scrolling only when the information cannot safely reflow. On narrow screens, task-appropriate responsive record lists may replace wide tables.

## Do's and Don'ts

### Do:

- **Do** keep Warm Ivory as the principal background and Clinical White as the working surface.
- **Do** lead primary actions and active states with Deep Clinic Green and Clinical Teal.
- **Do** keep role interfaces compact, symmetrical, task-focused, and clinically readable.
- **Do** preserve patient identity, workflow state, authorship, review state, and the next safe action in the visual hierarchy.
- **Do** pair semantic color with text, icons, labels, or structure.
- **Do** verify desktop, tablet, mobile, Arabic RTL, English LTR, keyboard focus, reduced motion, and high-contrast behavior.
- **Do** keep AI assistance inside the normal clinical component system with visible draft and doctor-review status.

### Don't:

- **Don't** use Reserved Terracotta as a dominant brand color or routine primary-action color.
- **Don't** introduce pink, bright gradients, decorative color, oversized cards, excessive shadows, glow, or generic AI-dashboard styling.
- **Don't** use color alone to communicate critical, warning, review, selected, completed, or disabled state.
- **Don't** expose raw JSON, endpoints, schema terms, stack traces, developer overlays, or internal permission mechanics in normal staff UI.
- **Don't** trade touch size, readability, or state clarity for density.
- **Don't** invent medical claims, clinical confidence, regulatory status, testimonials, or production-readiness signals.
