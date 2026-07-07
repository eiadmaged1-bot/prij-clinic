# Current Status

v1.3.7 public login real-device hotfix is implemented on the feature branch.

The browser calls the same-origin `/api/backend` path for login/session and normal API calls. The route-handler proxy forwards those requests internally to the API service on port 3001, using `PRIJ_API_INTERNAL_ORIGIN` when set and `http://localhost:3001` by default. The public browser `Origin` is not forwarded into the internal API request, so ngrok and other public web hosts do not trip the API CORS guard.

Public mobile QA needs only one public URL to port 3000. Never tunnel port 3001 for this app. Localhost, LAN, Tailscale, ngrok, Cloudflare Quick Tunnel, and future domain/VPS patterns use the same browser-facing API path.

Login Arabic/English labels and friendly connection/session messages are locked to the selected language without flipping the login layout. Invalid credentials remain a credential error; unauthenticated `auth/me` is a quiet logged-out state; network, timeout, malformed auth success, and 5xx remain friendly connection problems.

Clean public QA command flow:

```powershell
npm run dev:stop
docker compose up -d postgres
npm run prisma:repair
npm run prisma:seed
npm run dev
ngrok http 3000
```

Then open `https://<public-ngrok-url>/login`, verify `https://<public-ngrok-url>/api/backend/health`, and login with local QA credentials only.

v1.3.3 workflow compression, guideline import fixes, receptionist no-menu cockpit, always-visible logout, role navigation, demo/test filtering, receptionist check-in signature, doctor visit signature, case library, staff chat, Pharmacology safety foundation, and Guideline Library import foundation remain in place.

External AI remains disabled by default. No autonomous diagnosis, prescribing, dosing, treatment ranking, or automatic clinical finalization is allowed.
# v1.3.8 Current Status

v1.3.8 adds infertility workflow foundations, clinical phases, organized investigations, mobile drawer/footer fixes, and owner-only visit price audit endpoints.

Implemented: `INFERTILITY` patient type, clinical phase API/UI badges, Infertility tab, ovulation induction cycle records, AMH, follicular monitoring, E2 serial results, investigation categories/favorites/high priority/templates, global language/logout shell footer, fixed Arabic visit labels, and reception-visible Not sexually active checkbox.

Safety remains unchanged: no real patient data, no external AI, no automatic diagnosis, no automatic prescribing, no automatic dosing, and doctor review remains mandatory.
