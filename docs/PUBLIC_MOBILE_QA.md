# Public Mobile QA

Use public tunnels only for temporary QA/testing. Do not enter real patient data through ngrok, Cloudflare Quick Tunnel, or any public URL until deployment and security signoff is complete.

## Local Runner

```powershell
npm run dev:public
```

The runner stops old dev ports, repairs Prisma Client, runs the seed, starts the API on port 3001, and starts the web app on port 3000. Browser API calls go to `/api/backend` on the same web origin. The API port 3001 stays internal and does not need a public tunnel.

## ngrok

1. Run `npm run dev:public` or `npm run dev`.
2. Run `ngrok http 3000`.
3. Open the generated ngrok web URL on the phone.

Only one public tunnel to port 3000 is required.

## Cloudflare Quick Tunnel

1. Run `npm run dev:public` or `npm run dev`.
2. Run `cloudflared tunnel --url http://localhost:3000`.
3. Open the generated `trycloudflare.com` URL on the phone.

TryCloudflare creates a random `trycloudflare.com` subdomain and proxies it to the local web server, which is suitable for temporary QA.

## Permanent URL Pattern

For a stable URL, use Cloudflare Tunnel with an owned domain added to Cloudflare. A domain is required for a published application route. Add Cloudflare Access or equivalent protection before any real PHI/PII use.

Do not call this production-ready until deployment and security signoff is complete.
