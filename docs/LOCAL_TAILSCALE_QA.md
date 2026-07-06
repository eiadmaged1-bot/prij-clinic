# Local and Tailscale QA

v1.3.0 feature QA must pass on:

- Same PC: `http://localhost:3000`
- Tailscale/LAN: `http://<TAILSCALE_PC_IP>:3000`

The new frontend helpers use `getApiBaseUrl()` and do not hard-code localhost-only API calls.

Use existing dev workflows:

- `npm run dev`
- `npm run dev:lan`
- `npm run dev:tailscale`

Run `npm run test:v130:local-tailscale-workflow` before handoff.
