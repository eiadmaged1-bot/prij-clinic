# Known Limitations

External AI remains disabled by default.

AI cannot autonomously diagnose, prescribe, dose, rank treatments, or update final clinical records without doctor approval.

Guideline importer supports the built-in official/open source pack and manual licensed upload. Non-downloadable or unclear sources remain link-only or need manual upload. Imported PDFs are not committed.

Libya medication rows remain hidden/import-pending until an official source is uploaded or imported and reviewed.

Medication interaction checks are assistive. Unknown means no verified source record is loaded, not that a pair is safe.

The Next.js development issue overlay can appear only on the dev server. Use the production-like build/start path in `docs/LOCAL_TAILSCALE_QA.md` for visual mobile QA screenshots.

Public tunnel workflows are QA/testing only. Do not use real patient data through ngrok, Cloudflare Quick Tunnel, or any public URL until deployment, privacy, backup, access-control, and security signoff is complete.

Public login depends on the local dev stack running: web on port 3000, API internal on port 3001, and `/api/backend/health` returning healthy through the web origin. Use one public tunnel to port 3000 only; never tunnel port 3001 for this app.

Public QA command flow:

```powershell
npm run dev:stop
docker compose up -d postgres
npm run prisma:repair
npm run prisma:seed
npm run dev
ngrok http 3000
```

Open `https://<public-ngrok-url>/login`, check `https://<public-ngrok-url>/api/backend/health`, then login with local QA credentials only.

Cloudflare Quick Tunnel URLs are temporary random `trycloudflare.com` subdomains. A stable public route requires an owned domain added to Cloudflare or an equivalent deployment setup.
