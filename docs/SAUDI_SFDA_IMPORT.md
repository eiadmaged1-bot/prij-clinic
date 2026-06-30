# Saudi SFDA Import

Command:

```powershell
npm run medication:import:sfda -- --mode dry-run --max-pages 2
npm run medication:import:sfda -- --mode live --max-pages all
```

Status on 2026-06-30: public endpoint not stable.

The v0.8.1 connector does not brute-force or bypass SFDA public pages. It records a failed import run when no stable direct public endpoint is safely discoverable.

Next action: identify an official SFDA structured export or approved public API endpoint, then enable paginated import with rate limiting.
