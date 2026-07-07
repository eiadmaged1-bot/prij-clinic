# Next Steps

## v1.3.9 Next Steps

- Run real-device QA for Arabic navigation, mobile drawer footer, G/P/A/L steppers, pregnancy tab, Clinical Tag Search, EDD Calendar, and External Intake Inbox.
- Add richer duplicate merge tooling for reviewed external intake submissions.
- Add deeper clinical tag grouping, tag archive/deactivate UI, and high-risk pregnancy tag workflows.
- Add month/week EDD exports after role and privacy review.
- Add end-to-end browser tests for Google Form review actions against a running local stack.

Run real device QA on same-PC localhost, LAN, Tailscale, and one temporary public tunnel to port 3000.

For public QA, use `npm run dev`, then run `ngrok http 3000` or `cloudflared tunnel --url http://localhost:3000`. Do not expose API port 3001 publicly.

Confirm `http://localhost:3000/api/backend/health` before opening the public URL on a phone.

Use `npm run guidelines:import:official` to import the built-in official/open guideline source pack, then confirm recent indexed documents and search results. Imported PDFs must stay in private gitignored storage.

Load verified medication interaction sources before relying on source-specific interaction citations.

Continue manual QA for receptionist queue flow, doctor visit flow, RBAC, audit logs, and AI draft approval.

Continue checking that compressed mobile navigation, cockpit-only receptionist flow, Patient File tabs, Queue Board, and Today's Desk stay compact on real devices.

Before any real PHI/PII use through a public URL, complete deployment/security signoff and add access protection such as Cloudflare Access.
# v1.3.8 Next Steps

Recommended next sprint: v1.3.9 Clinical Phase Deepening + Owner Reporting QA.

Focus:
- Browser/manual QA for all role-specific mobile workflows.
- Richer phase transition UI for infertility-to-pregnancy linking.
- Investigation catalog seed enrichment for all required categories.
- Owner audit dashboard visual polish and report export governance.
- More end-to-end tests around actual API writes for infertility cycles and owner-only pricing denial.
