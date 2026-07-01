# Theme Import Guide

Prij Clinic can accept future theme direction from screenshots, Figma screenshots, CSS variables, Tailwind config snippets, color palettes, component mockups, sidebar/topbar concepts, dashboard mockups, and patient file mockups.

Rules:
- Use original design only. Do not copy competitor logos, assets, text, or proprietary UI kits unless licensed.
- Do not include real patient data in screenshots, prompts, examples, or seed files.
- Imported themes must preserve RBAC, navigation gating, consent, audit, and medication safety boundaries.
- Themes must not expose admin, owner, medication import, or review controls to unauthorized roles.
- Do not commit font files. Prefer CSS font-family stacks with safe fallbacks.
- Do not import fictional demo rows, fake clinical values, fake appointments, or fake finance values from design mockups.
- Do not iframe static design HTML as the product.

Current sprint source:
- `docs/design/prij-clinic-theme.html`

Current implementation:
- Theme id: `prij-heritage`
- Tokens live in `apps/web/app/globals.css`.
- Reusable component helpers live in `apps/web/components/prij-heritage.tsx`.
- Theme persistence remains the existing frontend/local appearance system; no new backend theme engine was added.
