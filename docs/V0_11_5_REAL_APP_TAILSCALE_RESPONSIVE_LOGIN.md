# v0.11.5 Real App Tailscale Responsive Login

Branch: `integration/v0.11.5-real-app-tailscale-responsive-login`

## Scope

- Real Next.js app shell responsive stability for `/dashboard` and `/prescriptions`.
- Dashboard Patient Search sizing fixed in the real app topbar.
- Root hydration warning guard for browser/Tailscale tooling that injects attributes into `<html>`.
- Explicit Tailscale/LAN API profile for phone login at `http://100.127.4.46:3000`.
- Exact-origin CORS support for configured local Tailscale host only.

No backend clinical logic, database schema, patient data, prescription dosing, AI diagnosis, AI prescribing, image metadata policy, queue date, encounter branch, encounter voiding, or static lab API behavior changed.

## Responsive Shell

- Desktop `>=1200px`: permanent left sidebar with internally scrollable navigation and content to the right.
- Tablet `768px-1199px`: topbar with drawer navigation; content starts near the top.
- Mobile `<768px`: compact topbar, left Menu button, centered Prij Clinic brand, drawer over content.
- Body horizontal overflow is blocked while drawer/sidebar/tab strips keep their intended internal scrolling.
- The grid-style navigation is confined to the sidebar/drawer and is not rendered as a large full-width panel above content.

## Tailscale Phone Dev Profile

Start the phone profile without writing `.env` files:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-lan-profile.ps1 -HostIp 100.127.4.46
```

Open on the phone:

```text
http://100.127.4.46:3000
```

Expected browser API base:

```text
http://100.127.4.46:3001
```

The profile sets exact local variables for the process only:

- `NEXT_PUBLIC_LAN_API_ORIGIN=http://100.127.4.46:3001`
- `NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK=false`
- `CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://100.127.4.46:3000`
- `API_HOST=0.0.0.0`
- `WEB_HOST=0.0.0.0`
- `HOST=0.0.0.0`

## Firewall Commands

Run manually only when needed from an elevated PowerShell:

```powershell
New-NetFirewallRule -DisplayName "Prij Clinic Web 3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
New-NetFirewallRule -DisplayName "Prij Clinic API 3001" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3001
```

## CORS Rules

- Exact `http://100.127.4.46:3000` is allowed in local/dev/test only when configured in `CORS_ORIGINS`.
- `100.64.0.0/10` CIDR remains rejected.
- `0.0.0.0/0`, `*`, public CIDRs, and unconfigured Tailscale origins remain rejected.
- Staging/production reject HTTP LAN/Tailscale origins.
- Staging/production must use exact HTTPS origins.

## Manual Phone QA

1. Start the LAN profile command above.
2. Open `http://100.127.4.46:3000`.
3. Confirm `/login` loads with no hydration overlay.
4. Sign in with safe local demo credentials only.
5. Confirm `/dashboard` and `/prescriptions` open.
6. Confirm API requests target `http://100.127.4.46:3001`, not localhost.
7. Resize desktop browser and confirm navigation never becomes a full-width grid.
8. Confirm Dashboard Patient Search is normal card/input size.
9. Confirm no body horizontal scroll.

## Checks

```powershell
npm run test:web:api-base
npm run test:security:cors
npm run test:web:hydration-root
npm run test:v114:responsive-shell
npm run test:v115:lan-smoke
```
