# Local + Tailscale QA

Use `npm run dev:lan` for same-PC and phone/tablet QA. The web app listens on port 3000 and the API listens on port 3001.

When opened from `localhost`, the frontend uses `http://localhost:3001`. When opened from a LAN or Tailscale hostname/IP, it derives `http://<same-hostname>:3001` unless `NEXT_PUBLIC_API_ORIGIN` or `NEXT_PUBLIC_LAN_API_ORIGIN` explicitly overrides it.

Basic Tailscale QA no longer requires manual `NEXT_PUBLIC_LAN_API_ORIGIN`.
