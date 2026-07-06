# Local Same-PC and Tailscale QA

Local same-PC and Tailscale QA are mandatory for v1.3.1 changes.

Requirements:
- Changed screens must use dynamic API base resolution, not hardcoded localhost-only fetches.
- Same-PC testing uses the normal local web/API ports.
- Tailscale testing uses `npm run dev:tailscale` and private tailnet access only.
- Do not use Tailscale Funnel or public exposure.
- CORS/auth/session expectations must not be weakened.
- Mobile, tablet, laptop, and desktop layouts must remain usable.

Verification:
```powershell
npm run test:v131:local-tailscale-qa
npm run test:web:api-base
npm run test:security:cors
```
