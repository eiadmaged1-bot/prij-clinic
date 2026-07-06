# v1.3.4 Public Mobile Single-Origin Access

v1.3.4 changes public mobile QA to a single-origin architecture.

- Browser opens one web URL on port 3000.
- Browser API calls use the relative same-origin path `/api/backend`.
- The Next.js web server proxies `/api/backend/*` internally to the API service.
- The default internal API origin is `http://localhost:3001`.
- `PRIJ_API_INTERNAL_ORIGIN` can override the internal origin for deployment layouts.
- `NEXT_PUBLIC_LAN_API_ORIGIN` remains a safe explicit override, but it is no longer required for normal public mobile QA.

This works for localhost, LAN, Tailscale, ngrok, Cloudflare Quick Tunnel, and future domain/VPS patterns because the phone only needs to reach the web origin.

Security boundaries remain unchanged: RBAC, audit logs, auth, CORS, document safety, and AI safety are not weakened. External AI remains disabled by default. The system does not autonomously diagnose, prescribe, dose, rank treatments, or finalize clinical records.

Public tunnels are for QA/testing only until deployment and security signoff. Do not use real patient data through public tunnels.
