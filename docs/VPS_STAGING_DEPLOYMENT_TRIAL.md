# VPS Staging Deployment Trial

Date: 2026-06-29

This checklist is for a real VPS staging deployment using fake/demo data only. It is not production approval and must not be used with real patient data, PHI files, real AI providers, or real payment gateways.

## Trial Metadata

| Item | Value |
| --- | --- |
| VPS provider | `<placeholder>` |
| Server IP | `<placeholder>` |
| OS version | Pending VPS execution |
| Docker version | Pending VPS execution |
| Docker Compose version | Pending VPS execution |
| Git version | Pending VPS execution |
| Firewall status | Pending VPS execution |
| Domain/subdomain | `<staging.example.invalid>` |
| TLS status | Pending; direct HTTP ports acceptable only for initial fake-data smoke |
| Repository branch | `deploy/vps-staging-trial` |
| Base local trial tag | `v0.1-local-staging-trial` |

## Deployment Status

| Area | Status | Notes |
| --- | --- | --- |
| Environment setup | Pending VPS credentials | Create `.env.staging` manually from `.env.staging.example`; never commit it |
| Docker bootstrap | Prepared | Use `scripts/bootstrap-vps-staging.sh` on Ubuntu/Debian VPS |
| Repository checkout | Pending | Clone repo and checkout `deploy/vps-staging-trial` or the approved tag |
| Compose startup | Pending | `docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml up -d --build` |
| Migration deploy | Pending | Run `npm run prisma:migrate:deploy` inside the API container; do not use reset/drop |
| Staging demo seed | Pending explicit approval | Use fake/demo staging data only; staging passwords must not be local defaults |
| Health checks | Pending | `/health`, `/health/db`, and `/login` |
| Remote smoke test | Pending | Run `npm run test:staging:smoke` with `STAGING_API_URL` and `STAGING_BASE_URL` |
| Backup | Pending | Create staging backup, encrypt before off-host transfer, do not commit |
| Rollback trial | Pending | Stop web/API, checkout previous known-good commit/tag, rebuild, no DB reset |

## Safe VPS Command Sequence

```bash
git clone <REPO_URL> prij-clinic
cd prij-clinic
git checkout deploy/vps-staging-trial
cp .env.staging.example .env.staging
# edit .env.staging with staging-only secrets and fake/demo passwords
./scripts/deploy-staging.sh --migrate --seed-demo
```

The deploy script refuses production mode, does not reset data, and requires explicit `--seed-demo` before running the staging demo seed.

## Smoke Test From Local Machine

```bash
STAGING_BASE_URL=https://staging.example.invalid \
STAGING_API_URL=https://staging-api.example.invalid \
STAGING_DEMO_OWNER_LOGIN=demo.owner@prij.local \
STAGING_DEMO_OWNER_PASSWORD='<staging-demo-password>' \
STAGING_DEMO_TEST_PASSWORD='<staging-demo-password>' \
npm run test:staging:smoke
```

Do not paste real production credentials into shell history. Prefer temporary shell variables or a local ignored env file.

## Reverse Proxy And TLS

Initial VPS smoke may use direct ports only while fake/demo data is loaded:

- Web: `http://<server-ip>:3000`
- API: `http://<server-ip>:3001`

Before any wider staging review, configure a reverse proxy and TLS:

1. Review `deploy/nginx.staging.example.conf`.
2. Replace `staging.example.invalid` and `staging-api.example.invalid` with approved staging hostnames.
3. Route web traffic to `127.0.0.1:3000`.
4. Route API traffic to `127.0.0.1:3001`.
5. Add TLS certificates with the chosen provider after DNS resolves.
6. Re-run remote staging smoke with HTTPS URLs.

Do not use real patient data on direct HTTP ports.

## Rollback Plan

1. Record the failing commit, container status, and error.
2. Stop API and web only:

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml stop web api
```

3. Checkout the previous known-good commit or tag.
4. Rebuild and restart API/web.
5. Do not reset/drop the staging database.
6. Restore only to a disposable restore-test environment unless an approved incident plan authorizes a live staging restore.

## Known Issues

- Real VPS deployment was not executed unless server credentials are provided.
- TLS/domain setup is pending until DNS and reverse proxy are configured.
- Staging remains fake/demo data only.
- Production remains blocked by `docs/PRODUCTION_READINESS_PLAN.md`, `docs/SECURITY_HARDENING_CHECKLIST.md`, and `docs/RELEASE_GATE_CHECKLIST.md`.
