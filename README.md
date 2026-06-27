# Prij Clinic

Clinic Management System MVP scaffold for OB/GYN and women's health.

This repository currently contains only the developer skeleton. Clinical workflows, authentication, patients, appointments, billing, reports, and AI implementation are intentionally not built yet.

## Safety Rules

- Do not use real patient data in development, tests, screenshots, seeds, or docs.
- Do not commit secrets, API keys, passwords, tokens, reports, backups, or patient data.
- AI features are disabled by default and not implemented in this scaffold.
- Clinical output must remain doctor-reviewed in future phases.

## Stack

- Monorepo with npm workspaces
- `apps/web`: Next.js frontend
- `apps/api`: NestJS API
- `packages/shared`: shared TypeScript package placeholder
- PostgreSQL via Docker Compose
- Prisma ORM in `apps/api`

## Setup

1. Install dependencies:

```powershell
npm install
```

2. Create local environment files from the example:

```powershell
Copy-Item .env.example .env
```

3. Start PostgreSQL:

```powershell
docker compose up -d postgres
```

4. Generate Prisma client:

```powershell
npm run prisma:generate
```

5. Start the API:

```powershell
npm run dev:api
```

The health check will be available at:

```text
http://localhost:3001/health
```

6. Start the web app:

```powershell
npm run dev:web
```

The web app will be available at:

```text
http://localhost:3000
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
```

## Current Scope

Implemented:

- API health check: `GET /health` returns `{ "status": "ok" }`
- Web placeholder page: `Prij Clinic MVP`
- Local PostgreSQL Docker Compose service
- Empty Prisma schema setup

Not implemented yet:

- Auth, RBAC, patients, appointments, queue, encounters, prescriptions, investigations, reports, billing, backups, audit logs, or AI features.
