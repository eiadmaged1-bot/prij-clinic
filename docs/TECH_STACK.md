# MVP Technical Stack Design

## Purpose
This document compares practical stack options for Prij Clinic and recommends a final stack for the MVP. It is documentation only. It does not scaffold or implement the app.

Prij Clinic handles sensitive clinic information. The stack must support authentication, server-side authorization, audit logging, encrypted configuration, secure report file storage, backups, and future AI draft workflows.

## Option 1: Fast MVP

### Stack
- Frontend: Next.js with TypeScript.
- API: Next.js route handlers or a small NestJS/Fastify API.
- Database: PostgreSQL.
- ORM: Prisma.
- Auth: Auth.js or custom session auth with secure cookies.
- File storage: S3-compatible object storage or protected local storage in development.
- Background jobs: BullMQ with Redis, or a managed queue if deployed on cloud.
- Validation: Zod.
- Testing: Vitest, Playwright, API integration tests.
- Deployment: Managed hosting for app plus managed PostgreSQL.

### Strengths
- Fast to build with one TypeScript language across web, API, validation, and shared types.
- Good developer experience and a large hiring pool.
- PostgreSQL supports relational integrity, audit queries, JSON metadata where useful, and future scaling.
- Prisma helps iterate on schema while keeping migrations explicit.

### Tradeoffs
- Requires discipline to keep business rules out of UI-only code.
- Next.js route handlers can become crowded if the API grows without clear module boundaries.
- Background jobs and file access controls must be designed deliberately.

## Option 2: Scalable Professional Version

### Stack
- Frontend: Next.js with TypeScript.
- API: NestJS with TypeScript.
- Database: PostgreSQL.
- ORM: Prisma or Drizzle.
- Cache and queue: Redis plus BullMQ.
- File storage: S3-compatible object storage with private buckets and short-lived signed access routed through authorization checks.
- Search: PostgreSQL full-text search first; OpenSearch later if needed.
- Observability: structured logs, metrics, tracing, alerting.
- Deployment: containerized services on a private cloud or managed Kubernetes only if operational maturity exists.
- Secrets: managed secret store.
- Backups: managed database backups plus tested object storage backups.

### Strengths
- Clear separation between frontend and API.
- Stronger module boundaries for RBAC, audit, billing, clinical records, reports, and future integrations.
- Easier to scale background jobs, integrations, reporting, and AI draft service boundaries later.

### Tradeoffs
- More initial setup than a single app.
- Requires more DevOps discipline.
- Slightly slower MVP start if the team is small.

## Option 3: Low-Cost Self-Hosted Version

### Stack
- Frontend and API: Next.js or NestJS served from a small clinic server or VPS.
- Database: PostgreSQL on the same server or a small managed database.
- File storage: encrypted local filesystem outside the repository, or self-hosted S3-compatible storage such as MinIO.
- Reverse proxy: Caddy or Nginx with TLS.
- Backups: encrypted database dumps plus encrypted file storage snapshots to an external drive or remote bucket.
- Monitoring: basic uptime, disk, backup, and restore-test alerts.

### Strengths
- Lower recurring cost.
- Can work for a small clinic if internet reliability or hosting budget is limited.
- Data location and backup ownership can be controlled directly.

### Tradeoffs
- Higher operational responsibility for security updates, backups, restore testing, TLS, disk monitoring, and disaster recovery.
- Local outages can interrupt clinic operations unless offline design is implemented well.
- Self-hosted file storage must be carefully protected from direct unauthenticated access.

## Final Recommended Stack

For Prij Clinic, use the scalable professional stack with a pragmatic MVP implementation:

- Monorepo: apps/web, apps/api, packages/shared.
- Frontend: Next.js with TypeScript.
- API: NestJS with TypeScript.
- Database: PostgreSQL.
- ORM and migrations: Prisma.
- Validation: Zod in shared schemas where useful, with server-side validation as the source of truth.
- Auth: secure server-managed sessions with password hashes, session expiry, throttling, and MFA-ready user fields.
- Authorization: explicit RBAC permissions checked in API services and route handlers.
- File storage: private S3-compatible object storage in deployed environments; protected local storage only for development with fake/demo files.
- Background jobs: Redis plus BullMQ for backups, report processing metadata tasks, audit-safe export jobs, and future integration queues.
- Testing: unit tests for permissions and validation, API integration tests for workflows, Playwright tests for critical staff flows.
- Observability: structured application logs with PHI/PII redaction rules.
- Secrets: environment variables supplied by a secret manager or deployment platform; never committed.
- Backups: encrypted PostgreSQL backups plus encrypted object storage backups with recorded restore tests.

## Rationale
This stack keeps the MVP fast enough while preserving clear boundaries for medical privacy, auditability, file security, and future AI draft features. A separate NestJS API is recommended because the domain has complex server-side rules: RBAC, branch scope, clinical record signing, corrections, report review, billing adjustments, audit logging, backups, and future AI approval workflows.

## Non-Goals
- Do not build AI in the MVP.
- Do not claim regulatory compliance from the stack choice alone.
- Do not store real patient data in development, tests, screenshots, seed data, or docs.
- Do not store report files, backups, secrets, or payment secrets in the repository.
