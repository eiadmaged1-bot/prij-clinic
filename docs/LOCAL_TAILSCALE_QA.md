# Local + Tailscale QA

Use `npm run dev:lan` for same-PC, LAN, and Tailscale phone/tablet QA. The web app listens on port 3000 and the API listens on port 3001.

In v1.3.5 the browser uses the same-origin `/api/backend` path for login/session and normal API calls. The web server proxies those requests internally to `http://localhost:3001` or `PRIJ_API_INTERNAL_ORIGIN`. The phone/tablet no longer needs to reach API port 3001 directly.

Open one URL:

```text
http://localhost:3000
http://<lan-ip>:3000
http://<tailscale-ip-or-magicdns>:3000
```

`NEXT_PUBLIC_LAN_API_ORIGIN` is not required for normal LAN/Tailscale/public tunnel login QA.

For production-like visual QA, run:

```bash
npm run build
npm run start:api
npm run start:web
```

Use this build/start path for mobile screenshots when the Next.js development issue overlay would otherwise appear. The dev overlay belongs to the development server, not the Prij Clinic application UI.

v1.3.5 keeps local same-PC, LAN, Tailscale, and one-tunnel public QA access working while preserving visible logout, role-based navigation, RBAC, audit expectations, and AI safety limits. External AI remains disabled by default, with no autonomous diagnosis, prescribing, dosing, or treatment ranking.
