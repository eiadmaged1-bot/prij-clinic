# Manual QA Wave 1 Startup

Manual QA is **pending**. Run these steps only after explicit approval. Use synthetic users and patients only; never use an active clinic database or real patient data.

## 1. Confirm Repository State

```powershell
Set-Location 'C:\Newfolder\prij clone'
git branch --show-current
git status --short
```

Require branch `release/production-launch-consolidation` and a clean worktree before continuing.

## 2. Create a Disposable QA Database

Choose a new name containing `_test_part_h_`, for example `prij_clinic_test_part_h_manual_20260712_01`. Have the authorized local PostgreSQL operator create that empty database. Do not use `prij_clinic_dev`, `prij_clinic_active`, `prisma db push`, `migrate reset`, or destructive SQL.

Before each Prisma mutation, print only the safe classification:

```powershell
$qaDatabase = 'prij_clinic_test_part_h_manual_20260712_01'
Write-Host "database name: $qaDatabase"
Write-Host 'host classification: isolated local QA PostgreSQL'
Write-Host 'schema: public'
Write-Host ('disposable: ' + ($qaDatabase -like '*_test_part_h_*'))
```

Set `DATABASE_URL` at process scope using credentials supplied by the authorized local operator. Do not paste a real connection string into this file, Git, screenshots, or defect reports:

```powershell
$env:DATABASE_URL = '<operator-supplied disposable QA database URL>'
```

## 3. Deploy Migrations and Seed Synthetic QA Data

```powershell
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npx prisma generate --schema apps/api/prisma/schema.prisma
```

Use the repository’s isolated QA fixture tooling to create synthetic Doctor, Receptionist, Owner, Nurse, and synthetic patient records. Do not run a production seed path, use real identities, or record fixture credentials in Git.

## 4. Start the Isolated Services

In an API PowerShell window that has the same process-level disposable `DATABASE_URL`:

```powershell
$env:PORT = '3101'
npm run dev -w apps/api
```

In a web PowerShell window:

```powershell
$env:PORT = '3100'
$env:API_INTERNAL_URL = 'http://127.0.0.1:3101'
npm run dev -w apps/web
```

Open `http://localhost:3100`. In browser developer tools, confirm application requests use `/api/backend/...`; no browser request should target port 3101 directly.

## 5. Optional External-Device Tunnel

Start exactly one tunnel, to the web application only:

```powershell
ngrok http 3100
```

Confirm the ngrok inspector shows web traffic to 3100 and that no tunnel targets 3101. Do not create or share a direct API URL. Open the HTTPS web URL on desktop and phone, while continuing to confirm browser API calls use `/api/backend`.

## 6. Evidence and Defects

- Capture screenshots only from synthetic fixtures and redact credentials, cookies, tokens, connection strings, and request headers.
- Assign a defect ID to every failure and record role, language, viewport, route, steps, expected result, actual result, and requestId where safe.
- Do not mark an item passed without direct manual observation.

## 7. Stop Safely and Preserve Reproduction State

Stop the API, web, and ngrok terminals with `Ctrl+C`. Verify no listener remains on 3100 or 3101 and no ngrok process remains. Do not use broad process termination if unrelated Node work is running.

Preserve the QA database unchanged while defects need reproduction. Removing it later requires explicit owner/operator approval and a separately reviewed command; this guide intentionally supplies no destructive database command.
