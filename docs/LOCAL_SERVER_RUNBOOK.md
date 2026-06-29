# Local Server Runbook

Date: 2026-06-29

This runbook is for running Prij Clinic on a current PC or old home PC as a local server with fake/demo data only. It is not approved for real patient data, PHI uploads, real AI providers, real payment gateways, or production clinical use.

## 1. Install Git/Docker/Node If Needed

Install:

- Git
- Docker and Docker Compose
- Node.js 22 for local checks and helper scripts

Verify:

```bash
git --version
docker --version
docker compose version
node --version
npm --version
```

## 2. Clone Repo

```bash
git clone <REPO_URL> prij-clinic
cd prij-clinic
```

Do not clone into a public shared folder.

## 3. Checkout Latest Local Staging Tag/Branch

For the current local-first path:

```bash
git checkout deploy/local-home-server-readiness
```

After the tag exists, a local server can instead use:

```bash
git checkout v0.1-local-home-server-ready
```

## 4. Configure Local Env From Examples

Create an ignored staging env file:

```bash
cp .env.staging.example .env.staging
```

Edit `.env.staging` manually with staging-only placeholder values and fake/demo passwords. Never commit `.env.staging`.

Check it:

```bash
npm run staging:env:check
```

## 5. Start Docker Staging Compose

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml up -d postgres
```

Wait until Postgres is healthy.

## 6. Run Migrate Deploy

Use migration deploy, not reset/drop:

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml run --rm api npm run prisma:migrate:deploy
```

Stop if any command asks to reset/drop the database.

## 7. Run Explicit Demo Seed

Only seed fake/demo data:

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml run --rm api npm run prisma:seed
```

Confirm demo credentials are staging/local-demo only and not used for production.

## 8. Run Health Checks

Start API and web:

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml up -d --build api web
```

Check:

```bash
curl -f http://localhost:3001/health
curl -f http://localhost:3001/health/db
curl -f http://localhost:3000/login
```

On Windows PowerShell, use `Invoke-WebRequest` if `curl` is not available.

## 9. Access App From Same PC

Open:

```text
http://localhost:3000
```

Use fake/demo login only. Do not enter real patient data.

## 10. Access App From Another Device On Same Wi-Fi/LAN

Find the server LAN IP:

```bash
ip addr
```

On Windows:

```powershell
ipconfig
```

Open from another LAN device:

```text
http://<server-lan-ip>:3000
```

Only do this on a trusted private network. Do not port-forward the router for real data.

## 11. Backup

Run the staging backup helper:

```bash
npm run backup:staging
```

Backups must remain in ignored backup folders and should be copied to an external/off-host encrypted location for serious staging.

## 12. Restore Drill

Do not restore over an active database unless explicitly intended. Practice restore only into a disposable restore-test database and record:

- backup file used
- target database
- restore command
- health check result
- smoke test result

## 13. Shutdown/Restart Procedure

Gracefully stop API and web only:

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml stop web api
```

Restart:

```bash
docker compose --env-file .env.staging -p prij-clinic-staging -f docker-compose.staging.yml up -d api web
```

Do not run `docker compose down -v` for this project.

## 14. Troubleshooting Docker

- Confirm Docker is running.
- Confirm ports 3000 and 3001 are free.
- Confirm `.env.staging` exists and passes `npm run staging:env:check`.
- Confirm Postgres container is healthy.
- Re-run `npm run prisma:repair` locally if generated Prisma client issues appear.
- Review container logs without copying secrets into docs or commits.

## 15. Safety Warnings

- No real patient data.
- No PHI uploads.
- No real payment gateway.
- No external AI provider.
- No router port forwarding until a hardening review is complete.
- HTTPS is required before any real clinic pilot.
- Production remains blocked by legal, privacy, security, backup, monitoring, and clinical governance gates.
