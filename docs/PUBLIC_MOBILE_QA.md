# Public Mobile QA

Use public tunnels only for temporary QA/testing. Do not enter real patient data through ngrok, Cloudflare Quick Tunnel, or any public URL until deployment and security signoff is complete.

v1.3.7 public login uses the same-origin `/api/backend` browser path. The API remains internal on port 3001.

## v1.3.7 ngrok Login QA Flow

```powershell
npm run dev:stop
docker compose up -d postgres
npm run prisma:repair
npm run prisma:seed
npm run dev
ngrok http 3000
```

Then open:

```text
https://<public-ngrok-url>/login
https://<public-ngrok-url>/api/backend/health
```

Login with the local seeded QA owner only. Do not enter real patient data through the public tunnel.

Only one public tunnel to port 3000 is required. Never tunnel port 3001 for this app.

## Local Runner

```powershell
npm run dev:public
```

The runner stops old dev ports, repairs Prisma Client, runs the seed, starts the API on port 3001, and starts the web app on port 3000. Browser API calls go to `/api/backend` on the same web origin. The API port 3001 stays internal and does not need a public tunnel.

## Cloudflare Quick Tunnel

1. Run `npm run dev`.
2. Run `cloudflared tunnel --url http://localhost:3000`.
3. Open the generated `trycloudflare.com` URL on the phone.

TryCloudflare creates a random `trycloudflare.com` subdomain and proxies it to the local web server, which is suitable for temporary QA.

## Permanent URL Pattern

For a stable URL, use Cloudflare Tunnel with an owned domain added to Cloudflare. A domain is required for a published application route. Add Cloudflare Access or equivalent protection before any real PHI/PII use.

Login should work through the public URL when the local dev stack is running and `/api/backend/health` is healthy. The public browser posts to `https://<public-domain>/api/backend/auth/login`; the web server forwards internally to `http://127.0.0.1:3001` or `http://localhost:3001`.

Arabic/English login translation is locked: selected English shows English login labels/messages, selected Arabic shows Arabic login labels/messages, and the login layout does not flip.

External AI remains disabled by default. There is no autonomous diagnosis, prescribing, dosing, or treatment ranking.

Do not call this production-ready until deployment and security signoff is complete.
