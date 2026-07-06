# Local + Tailscale QA

Use `npm run dev:lan` for same-PC and phone/tablet QA. The web app listens on port 3000 and the API listens on port 3001.

When opened from `localhost`, the frontend uses `http://localhost:3001`. When opened from a LAN or Tailscale hostname/IP, it derives `http://<same-hostname>:3001` unless `NEXT_PUBLIC_API_ORIGIN` or `NEXT_PUBLIC_LAN_API_ORIGIN` explicitly overrides it.

Basic Tailscale QA no longer requires manual `NEXT_PUBLIC_LAN_API_ORIGIN`.

For production-like visual QA, run:

```bash
npm run build
npm run start:api
npm run start:web
```

Use this build/start path for mobile screenshots when the Next.js development issue overlay would otherwise appear. The dev overlay belongs to the development server, not the Prij Clinic application UI.
