# Staging Smoke Tests

`npm run test:v180:staging-smoke` is a static staging package smoke test. It does not require a real staging server.

It verifies:
- Health and DB health endpoint configuration.
- Documentation for `/health/db`.
- Login, clinic walkthrough, patients, reception check-in, doctor waiting, AI assistant, and admin security readiness routes.
- AI assistant and admin security readiness remain protected/draft/safety-oriented.
- External AI is disabled by default.
- Staging seed flags are safe by default.
- Normal UI avoids raw developer wording.
- Real env files, backups, storage, uploads, logs, and secret-looking values are not tracked.

Live smoke:
- `npm run staging:health-check` verifies a running web/API pair.
- `npm run staging:smoke` currently runs the health check wrapper.

Use fake/demo staging data only. Do not use real patient data.
