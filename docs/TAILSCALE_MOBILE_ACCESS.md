# Tailscale Mobile Dev Access

This is for local development on a private Tailscale tailnet only. Do not use Tailscale Funnel, public internet exposure, real patient data, production secrets, or real payment/AI integrations.

## Start

```powershell
npm run dev:tailscale
```

In another terminal:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/print-tailscale-dev-url.ps1
```

Open the printed mobile URL on a phone that is connected to the same Tailscale account/tailnet:

```text
http://<tailscale-ip>:3000
```

The API health URL should be:

```text
http://<tailscale-ip>:3001/health
```

MagicDNS names ending in `.ts.net` are supported in local development when the phone can resolve them.

## Behavior

- The API binds to `0.0.0.0` only for the Tailscale dev script or when `API_HOST=0.0.0.0` is explicitly set.
- The web dev server binds to `0.0.0.0:3000` through the existing LAN web script.
- Browser API calls use `localhost:3001` from localhost, and the same Tailscale host with port `3001` from Tailscale IP or MagicDNS hosts.
- Backend CORS allows localhost, exact configured origins, and local-dev Tailscale IP/MagicDNS origins on port `3000`.
- Staging and production still reject HTTP Tailscale/LAN origins and require exact HTTPS origins.

## Firewall

If the phone cannot connect while Tailscale is connected, allow inbound TCP ports `3000` and `3001` on the development computer for the private Tailscale network only.

## Safety Limits

- Tailnet-only local dev access, not public hosting.
- No Tailscale Funnel.
- No real patient data.
- No external AI calls.
- No real payment gateway.
- Auth, RBAC, audit logging, patient scope checks, consent boundaries, and AI draft-only safety remain active.
