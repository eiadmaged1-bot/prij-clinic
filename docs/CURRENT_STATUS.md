# Current Status

v1.3.5 public login and language lock is implemented on the feature branch.

The browser now calls the same-origin `/api/backend` path for login/session and normal API calls. The web server proxies those requests internally to the API service on port 3001, using `PRIJ_API_INTERNAL_ORIGIN` when set and `http://localhost:3001` by default.

Public mobile QA now needs only one public URL to port 3000. Localhost, LAN, Tailscale, ngrok, Cloudflare Quick Tunnel, and future domain/VPS patterns use the same browser-facing API path.

Login Arabic/English labels and friendly connection/session messages are locked to the selected language without flipping the login layout.

v1.3.3 workflow compression, guideline import fixes, receptionist no-menu cockpit, always-visible logout, role navigation, demo/test filtering, receptionist check-in signature, doctor visit signature, case library, staff chat, Pharmacology safety foundation, and Guideline Library import foundation remain in place.

External AI remains disabled by default. No autonomous diagnosis, prescribing, dosing, treatment ranking, or automatic clinical finalization is allowed.
