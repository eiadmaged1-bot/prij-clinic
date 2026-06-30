# Icon System

The icon system is local and license-safe.

## Files

- `apps/web/lib/app-icons.ts`
- `apps/web/components/ui/AppIcon.tsx`
- `apps/web/components/ui/IconBadge3D.tsx`
- legacy medical icons remain in `apps/web/components/ThreeDMedicalIcon.tsx`

## Behavior

- Icons are lightweight local React/SVG components.
- The 3D effect is created with CSS gradients, shadows, and local Lucide line icons.
- No remote icon URLs are loaded at runtime.
- No binary icon packs are committed.
- If a specific 3D asset is unavailable, the fallback is a premium 3D-styled gradient badge with a related line icon.

## Coverage

Mappings exist for dashboard, patients, appointments, queue, doctor mode, encounters, prescriptions, medication center, drug market, medication safety, allergies, investigations, lab orders, radiology, reports, pregnancy, ultrasound, gynecology, protocol atlas, AI drafts, guidelines, finance, consents, timeline, owner/admin controls, audit, backup, security, support, WhatsApp placeholder, inventory placeholder, and analytics placeholder.

Run:

```powershell
npm run test:icons:ui
```
