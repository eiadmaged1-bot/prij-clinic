# v1.3.5 Public Login + Language Lock

v1.3.5 locks public login to the same-origin API proxy and fixes login language consistency.

- Public mobile QA uses one tunnel only: `ngrok http 3000`.
- API remains internal on port 3001.
- Browser login/session calls use `/api/backend/auth/login`, `/api/backend/auth/me`, and `/api/backend/auth/logout`.
- The web server forwards `/api/backend/*` only to `PRIJ_API_INTERNAL_ORIGIN`, defaulting server-side to `http://localhost:3001`.
- `PRIJ_API_INTERNAL_ORIGIN` is not exposed to the browser.
- `NEXT_PUBLIC_LAN_API_ORIGIN` is not required for normal public tunnel login.
- `/api/backend/health` verifies the same-origin proxy path.
- Login English and Arabic labels/messages are selected from one login language state.
- Arabic text renders inside stable LTR component positions; the login layout does not flip.

Public tunnel QA is temporary QA only. Do not use real patient data through ngrok, Cloudflare Tunnel, or any public URL until deployment, privacy, backup, access-control, and security signoff is complete.

External AI remains disabled by default. The system must not autonomously diagnose, prescribe, dose, rank treatment, or finalize clinical records.
