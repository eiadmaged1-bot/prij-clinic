# Prij Clinic

Clinic Management System MVP scaffold for OB/GYN and women's health.

Sprint 1 implements the Auth + RBAC + Audit foundation only. Patients, appointments, queue, encounters, prescriptions, investigations, reports, billing, and AI are intentionally not implemented yet.

## Safety Rules

- Do not use real patient data in development, tests, screenshots, seeds, or docs.
- Do not commit secrets, API keys, passwords, tokens, reports, backups, or patient data.
- AI features are disabled and not implemented in this sprint.
- Clinical output must remain doctor-reviewed in future phases.

## Stack

- Monorepo with npm workspaces
- `apps/web`: Next.js frontend
- `apps/api`: NestJS API
- PostgreSQL via Docker Compose
- Prisma ORM in `apps/api`

## Windows PowerShell Setup

Install dependencies:

```powershell
npm install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` locally. Use real local values only in `.env`, never in `.env.example`.

Required Sprint 1 variables:

```powershell
API_PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your-local-dev-secret
JWT_EXPIRES_IN=1h
DEMO_OWNER_EMAIL=owner@prij.local
DEMO_OWNER_PASSWORD=LocalDev123!
SEED_DEMO_OWNER=true
```

The demo owner account is for local development only. The seed hashes the password before storing it and does not create patient data.

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

Generate Prisma Client:

```powershell
npm run prisma:generate
```

Apply local migrations:

```powershell
npm run prisma:migrate:dev -- --name auth_rbac_audit_foundation
```

Seed non-clinical foundation data:

```powershell
npm run prisma:seed
```

Start the API:

```powershell
npm run dev:api
```

Start the web app in another PowerShell window:

```powershell
npm run dev:web
```

Open:

```text
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/dashboard
```

## Current Endpoints

Health checks:

```text
GET http://localhost:3001/health
GET http://localhost:3001/health/db
```

Auth:

```text
POST http://localhost:3001/auth/login
GET  http://localhost:3001/auth/me
POST http://localhost:3001/auth/logout
```

Admin:

```text
GET http://localhost:3001/admin/users
GET http://localhost:3001/admin/roles
GET http://localhost:3001/admin/permissions
```

Audit:

```text
GET http://localhost:3001/audit
```

## API Test Commands

Login and save the Bearer token:

```powershell
$body = @{
  email = "owner@prij.local"
  password = "LocalDev123!"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3001/auth/login" `
  -ContentType "application/json" `
  -Body $body `
  -SessionVariable session

$token = $login.token
$headers = @{ Authorization = "Bearer $token" }
```

Test current user:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3001/auth/me" `
  -Headers $headers
```

Health check commands:

```powershell
Invoke-RestMethod "http://localhost:3001/health"
Invoke-RestMethod "http://localhost:3001/health/db"
```

Test admin users:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3001/admin/users" `
  -Headers $headers
```

Test audit logs:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3001/audit" `
  -Headers $headers
```

Test logout:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3001/auth/logout" `
  -Headers $headers
```

Cookie-based testing also works by reusing `$session`:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3001/auth/me" `
  -WebSession $session
```

## Commands

```powershell
npm run dev
npm run dev:web
npm run dev:api
npm run build
npm run lint
npm run typecheck
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
```

Prisma scripts are reliable from the repository root. The API Prisma wrapper loads root `.env` before running Prisma CLI commands.
