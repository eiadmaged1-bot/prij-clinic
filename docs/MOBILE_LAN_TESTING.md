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

The browser API helper maps a LAN web URL such as `http://192.168.x.x:3000` to:

```text
http://192.168.x.x:3001
```

Local desktop browsing on `http://localhost:3000` continues to use the local API fallback.

## API Health

From the phone browser, check:

```text
http://PC_IP:3001/health
```

If the page does not open, confirm the API is running and allow local firewall access for Node.js on ports 3000 and 3001.

## Safety Notes

- Use fake demo data only.
- Do not upload patient files, PDFs, raw imports, or screenshots containing sensitive data.
- Production CORS remains strict; LAN-origin allowance is development/local only.
