# Public Mobile QA

Use public tunnels only for temporary QA/testing. Do not enter real patient data through ngrok, Cloudflare Quick Tunnel, or any public URL until deployment and security signoff is complete.

v1.3.5 public login uses the same-origin `/api/backend` browser path. The API remains internal on port 3001.

## Local Runner

```powershell
npm run dev:public
```

The runner stops old dev ports, repairs Prisma Client, runs the seed, starts the API on port 3001, and starts the web app on port 3000. Browser API calls go to `/api/backend` on the same web origin. The API port 3001 stays internal and does not need a public tunnel.

## ngrok

1. Run `npm run dev`.
2. Run `ngrok http 3000`.
3. Open the generated ngrok web URL on the phone.

Only one public tunnel to port 3000 is required. Do not run ngrok to port 3001.

## Cloudflare Quick Tunnel

1. Run `npm run dev`.
2. Run `cloudflared tunnel --url http://localhost:3000`.
3. Open the generated `trycloudflare.com` URL on the phone.

TryCloudflare creates a random `trycloudflare.com` subdomain and proxies it to the local web server, which is suitable for temporary QA.

## Permanent URL Pattern

For a stable URL, use Cloudflare Tunnel with an owned domain added to Cloudflare. A domain is required for a published application route. Add Cloudflare Access or equivalent protection before any real PHI/PII use.

Login should work through the public URL when the local dev stack is running and `/api/backend/health` is healthy.

Arabic/English login translation is locked: selected English shows English login labels/messages, selected Arabic shows Arabic login labels/messages, and the login layout does not flip.

External AI remains disabled by default. There is no autonomous diagnosis, prescribing, dosing, or treatment ranking.

Do not call this production-ready until deployment and security signoff is complete.
