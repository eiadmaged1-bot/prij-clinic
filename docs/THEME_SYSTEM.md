# Theme System

The theme system is defined in `apps/web/lib/theme-registry.ts`.

## Themes

- `luxury-clinic`: off-white/slate workspace, deep navy text, teal accent, readable glass-like cards.
- `medicolize-portal`: clinic portal feel with deep purple sidebar, white content, compact badges, and search-first topbar.
- `incision-clean`: clean launcher style with rounded cards and subtle shadows.
- `compact-operations`: dense receptionist/finance workflow layout.
- `senior-doctor-large`: larger fonts and controls for older doctors.
- `dark-navy`: premium dark clinical UI with no pure black surfaces.

Legacy IDs are normalized:

- `clinic-premium` -> `luxury-clinic`
- `minimal-clean` -> `luxury-clinic`
- `incision-portal` -> `incision-clean`

## Density

Density modes are CSS-variable driven:

- `compact`
- `comfortable`
- `large`
- `magnified`

Density changes spacing, font scale, control height, row padding, and sidebar width. It must not change routes, tabs, permissions, or data access.

## Testing

Run:

```powershell
npm run test:theme:ui
npm run test:theme:consistency
```
