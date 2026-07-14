# Desktop Clinical Design System

The desktop workspace uses a restrained clinical palette: warm ivory canvas, deep green/navy navigation, white cards, teal primary actions, and muted gold only for limited owner/premium accents. Borders and shadows are subtle; heavy gradients and glow are avoided.

Layout rules:

- Desktop sidebar target: 240–260px, with content visible beside it.
- Main content: strict 12-column grid with a 1440–1600px maximum width.
- Spacing scale: 4, 8, 12, 16, 24, and 32px.
- Compact KPI height target: 96–112px.
- Equal-height cards within rows and compact operational copy.
- Mobile/tablet navigation is a closed-by-default drawer; navigation closes it and must not cause horizontal overflow.

Shared primitives include `PageShell`, `PageHeader`, `CompactKpiCard`, `SectionCard`, `Tabs`, `SegmentedControl`, `EmptyState`, `PatientIdentityBar`, `ClinicalTagCard`, `FilterDrawer`, `ActionToolbar`, `SplitPane`, `Stepper`, `DataTable`, and `UserMenu`.

Normal UI uses friendly domain language. It must not expose raw JSON, internal endpoint/schema terminology, stack traces, developer overlays, or developer-only safety controls. Role pages render only permitted content, with finance summaries hidden unless the session has finance permission.

Target desktop QA sizes are 1366×768, 1440×900, 1920×1080, and 2560×1440. Results belong in `docs/MANUAL_QA_REPORT.md` and are not considered passed until executed.
# v1.4.4 operational additions

Operational surfaces use compact panels, 4/8/12/16/24/32 spacing, equal-height KPI grids, controlled content width, and responsive single-column fallbacks. Investigation ordering uses a 7/5 catalog-to-basket split; guideline viewing uses a 3/9 TOC-to-content split. Patient context bars visually lock identity before clinical writes.

RTL uses logical inline flow and targeted mirrored shell rules. Dedicated print routes do not inherit application navigation. Remaining legacy symmetry and translation gaps are tracked in `KNOWN_LIMITATIONS.md` rather than represented as complete.
