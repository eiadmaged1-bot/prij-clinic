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

3. Start PostgreSQL when working on database-backed features:

```powershell
docker compose up -d postgres
```

4. Generate Prisma Client:

```powershell
npm run prisma:generate
```

5. Apply local development migrations:

```powershell
npm run prisma:migrate:dev
```

6. Seed foundation data only:

```powershell
npm run prisma:seed
```

The seed creates one demo branch, core roles, and core permissions only. It does not create patients, clinical records, billing records, reports, AI records, real users, passwords, or secrets.

7. Start the API:

```powershell
npm run dev:api
```

Health checks will be available at:

```text
http://localhost:3001/health
http://localhost:3001/health/db
```

`GET /health` does not require a database connection. `GET /health/db` checks PostgreSQL connectivity and returns a safe non-sensitive unavailable response if the database cannot be reached.

8. Start the web app:

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
npm run prisma:seed
```

Run Prisma from the repository root through the workspace scripts:

```powershell
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
```

The API workspace also exposes the same commands directly:

```powershell
npm run prisma:generate -w apps/api
npm run prisma:migrate:dev -w apps/api
npm run prisma:seed -w apps/api
```

Use `prisma:generate` after schema changes. Use `prisma:migrate:dev` when PostgreSQL is running and you are ready to create/apply a local development migration. Use `prisma:seed` after migrations to load non-clinical foundation data.

## Current Scope

Implemented:

- API health check: `GET /health` returns `{ "status": "ok" }`
- Database health check: `GET /health/db` checks PostgreSQL through Prisma without leaking connection details
- Web placeholder page: `Prij Clinic MVP`
- Local PostgreSQL Docker Compose service
- First Prisma foundation models for branches, users, roles, permissions, RBAC joins, and audit logs
- Prisma service/module enabled with lazy database connectivity
- Foundation seed for one demo branch, core roles, and core permissions only

Not implemented yet:

- Auth flows, patient records, appointments, queue, encounters, prescriptions, investigations, reports, billing, backups, or AI features.
