# Mobile LAN Testing

Use this checklist to open Prij Clinic from a phone browser on the same Wi-Fi as the development PC.

## Start Local Dev

From the project root:

```powershell
npm run dev
```

The web app listens on port 3000 and the API listens on port 3001.

## Find The PC IP

On Windows:

```powershell
ipconfig
```

Use the IPv4 address for the active Wi-Fi adapter, for example `192.168.x.x`.

## Open From Phone

Connect the phone to the same Wi-Fi network, then open:

```text
http://PC_IP:3000
```

Preferred setup is explicit. Set the web app API origin to the same PC API host:

```text
NEXT_PUBLIC_LAN_API_ORIGIN=http://PC_IP:3001
NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK=false
```

The backend must also explicitly allow the phone-facing web origin:

```text
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://PC_IP:3000
```

Local desktop browsing on `http://localhost:3000` continues to use `http://localhost:3001` when no explicit API URL is set. Dynamic LAN same-host fallback is local-development only and requires `NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK=true`.

## API Health

From the phone browser, check:

```text
http://PC_IP:3001/health
```

If the page does not open, confirm the API is running and allow local firewall access for Node.js on ports 3000 and 3001.

## Safety Notes

- Use fake demo data only.
- Do not upload patient files, PDFs, raw imports, or screenshots containing sensitive data.
- Prefer explicit LAN IP or `.local` hostnames over subnet allowances.
- Production and staging CORS must use exact HTTPS origins. Do not use `*` or private CIDRs in any healthcare staging/production environment.
