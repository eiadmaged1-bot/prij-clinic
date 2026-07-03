# LAN Dev CORS Hardening

This sprint hardens local/LAN API resolution and backend CORS parsing. It is for local development only and does not change clinical logic, database schema, RBAC, audit behavior, auth, or AI behavior.

## Frontend API Resolution

The web app uses explicit API origins first:

- `API_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_LAN_API_ORIGIN`

Local browser sessions on `localhost` or `127.0.0.1` can fall back to `http://localhost:3001`.

LAN browser sessions do not derive `http://current-host:3001` in staging or production. In local development only, same-host LAN fallback requires:

```text
NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK=true
```

and the browser host must be a private IPv4 address or a `.local` mDNS hostname.

## Backend CORS Parsing

`CORS_ORIGINS` is comma-separated exact origins only:

```text
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.50:3000,http://prij-clinic.local:3000
```

Private subnet matching is separate and dev/test/local only:

```text
APP_ENV=local
CORS_PRIVATE_CIDRS=192.168.1.0/24
CORS_PRIVATE_PORTS=3000
```

Only RFC1918 private ranges are accepted for `CORS_PRIVATE_CIDRS`: `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`.

## Example 1 - Explicit LAN IP

```text
NEXT_PUBLIC_LAN_API_ORIGIN=http://192.168.1.50:3001
NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK=false
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.50:3000
```

## Example 2 - `.local` mDNS

```text
NEXT_PUBLIC_LAN_API_ORIGIN=http://prij-clinic.local:3001
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://prij-clinic.local:3000
```

Use `.local` only after mDNS/Bonjour name resolution works from the phone or tablet.

## Example 3 - Dev-Only Private CIDR

```text
APP_ENV=local
CORS_PRIVATE_CIDRS=192.168.1.0/24
CORS_PRIVATE_PORTS=3000
```

Prefer exact LAN host/IP origins when possible. CIDR is only for local developer convenience.

## Staging And Production

- Do not use private CIDR in staging or production.
- Do not use `*` in any healthcare environment.
- Staging and production must use exact HTTPS origins.
- If staging/production has no configured origins, browser CORS fails closed.
- LAN fallback and private subnet matching are forbidden outside local/dev/test.
