# Theme Navigation Consistency

Themes change appearance only. Themes must not add, remove, or rename available navigation or patient tabs.

Shared manifests:

- `apps/web/lib/navigation-manifest.ts`
- `apps/web/lib/patient-tabs-manifest.ts`

Independent display axes:

- `data-theme`: visual theme.
- `data-density`: `comfortable` or `compact`.
- `data-scale`: `normal` or `magnified`.
- `data-motion`: `normal` or `reduced`.

The app shell and patient file read navigation/tab definitions from manifests, then apply RBAC filtering. Theme selection must not create a separate navigation surface.
