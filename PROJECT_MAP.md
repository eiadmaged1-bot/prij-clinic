# Prij Clinic — Current Project Map

## 1. Authoritative baseline

- Active development branch: `current/known-good-pre-impeccable`
- Immutable rollback branch: `stable/known-good-pre-impeccable-20260805`
- Immutable rollback tag: `known-good-pre-impeccable-20260805`
- Approved Windows working folder: `C:\Newfolder\prij-clinic`
- Safe login URL: `http://localhost:3000/login`
- Web port: `3000`
- API port: `3001`
- PostgreSQL container: `prij-clinic-postgres`
- PostgreSQL service must use the preserved Docker volume; normal launch must never create, reset, seed, restore, or replace clinical data.

## 2. Runtime contract

Normal opening is intentionally simple:

1. Docker Desktop must already be running.
2. Start only the preserved PostgreSQL service.
3. Stop stale web/API development processes.
4. Start API with `npm run dev:api`.
5. Start web with `npm run dev:web`.
6. Open `/login` after the web application responds.

Normal opening must not run:

- `npm install` or `npm ci`
- Git checkout, pull, reset, clean, or force operations
- Prisma migration, repair, reset, seed, or database restore
- Docker volume deletion or recreation
- ProjectOS managed-version checkout generation

## 3. Current architecture

### Web application

- Next.js workspace under `apps/web`
- Browser entry point at port `3000`
- Browser API requests use same-origin `/api/backend`

### API

- NestJS workspace under `apps/api`
- Local API port `3001`
- Prisma Client reads `DATABASE_URL`

### Database

- PostgreSQL 16 in Docker
- Local database name: `prij_clinic_dev`
- Clinical records, users, permissions, preferences, queue state, patient records, reports, and document metadata are database-backed

### File storage

- Patient and guideline document records can contain storage keys and hashes
- Physical PDFs/uploads may live outside PostgreSQL
- Database backup alone is not a complete document backup

### Source control

- GitHub stores application source and non-sensitive assets only
- `.env`, patient data, database dumps, uploaded PDFs, and protected clinical files must remain outside the public repository

## 4. Completed recovery and safety work

- Recovered the required pre-Impeccable application baseline
- Preserved a stable rollback branch and tag
- Preserved the known working PostgreSQL database
- Repaired missing authentication/account schema objects without destructive reset
- Added a safe start script
- Added a safe stop script
- Added an explicit ProjectOS launch profile
- Blocked automatic Git, dependency, migration, seed, repair, and restore operations during normal launch
- Added exact-branch activation that works even when a clone has a restricted Git fetch refspec
- Added a read-only runtime and data-count status check

## 5. Current phase

### Phase A — Runtime reliability and source-of-truth lock

Status: **in progress, nearly complete**

Acceptance criteria:

- One approved source folder
- One approved active branch
- One immutable rollback point
- One preserved PostgreSQL volume
- One safe start path
- One safe stop path
- Read-only health/status reporting
- No hidden ProjectOS checkout or database mutation

## 6. Next plan

### Phase B — Data portability and two-PC safety

Priority: **next**

Deliverables:

- One-command encrypted PostgreSQL backup
- File-storage discovery and backup manifest
- SHA-256 manifest for PDFs/uploads
- Restore into a separate validation database before promotion
- Explicit primary-PC/client-PC operating model
- No bidirectional merging of two independent clinical databases

### Phase C — Controlled manual QA baseline

Priority: **after data safety**

Test the recovered application without redesign:

- Login and role visibility
- Reception queue and check-in
- Doctor Start/Resume/Complete visit flow
- Patient search and patient file
- Pregnancy, gynecology, infertility, prescriptions, investigations, ultrasound, reports, billing, and printing
- Arabic/English and RTL behavior
- PDF/document open, upload, and persistence
- Restart persistence and session behavior

Every defect must be recorded with:

- Role
- Patient/test record
- Exact route
- Reproduction steps
- Expected result
- Actual result
- Screenshot/log
- Severity

### Phase D — Core workflow stabilization

Priority: **after QA evidence**

Focus order:

1. Authentication, session, and permissions reliability
2. Queue and encounter integrity
3. Patient file and visit persistence
4. Investigations and report storage
5. Ultrasound structured workflow
6. Prescription and medication workflow
7. Billing and payment integrity
8. Arabic/RTL and printing

### Phase E — Product upgrades

Only after the recovered baseline is stable:

- Compact role-specific dashboards
- Improved doctor workspace while preserving the classic workspace
- Faster patient search and smart tags
- Better investigations station
- Guideline and protocol library integration
- Medication intelligence and pregnancy/lactation cards
- Ultrasound viewer and structured findings
- Offline-first registration and sync architecture

## 7. Change-control rules

- Never modify the immutable stable branch
- Develop from `current/known-good-pre-impeccable` using focused feature branches
- One functional concern per pull request whenever practical
- Database changes require additive migrations, backup, rollback plan, and validation
- Never seed, clean, reset, or restore the working clinical database during routine startup
- Never place real patient data, PDFs, dumps, `.env`, or credentials in GitHub
- Keep classic/known-good workflows available until replacements pass acceptance testing

## 8. Immediate next action

1. Activate and fast-forward the approved branch safely.
2. Start the application using the safe launcher.
3. Run the read-only status command.
4. Freeze a fresh encrypted database and document backup.
5. Begin the controlled manual QA checklist from login through patient file and visit completion.
