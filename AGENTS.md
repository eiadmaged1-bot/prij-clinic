# Prij Clinic — Codex Rules

## Project
We are building a Clinic Management System for OB/GYN and women’s health.

## Critical rules
- Do not use real patient data.
- Do not create fake “production-ready” medical claims.
- Do not store secrets, API keys, passwords, tokens, or patient data in code.
- AI must assist only. It must never replace the doctor.
- AI clinical output must stay draft-only until reviewed and approved by a doctor.
- All clinical record changes must support audit logs.
- Prioritize security, RBAC, consent, backups, and privacy from the beginning.

## Build order
1. Requirements and documentation
2. Architecture
3. Database model
4. Security model
5. Basic app scaffold
6. MVP features
7. AI draft features later

## MVP focus
Patients, appointments, queue, doctor calendar, patient profile, encounters, prescriptions, investigations, reports, billing, payments, roles, permissions, audit logs, backups, and security.

## Behavior
Before editing files, explain the plan.
After editing files, summarize exactly what changed.
When possible, run tests or type checks.
Do not install large dependencies without asking.
Do not use dangerous/full-access mode.

## Token budget
- Apply the `context-budget` skill at the start of every task.
- Apply `targeted-retrieval` before opening source files.
- Apply `compact-handoff` when pausing or transferring work.
- Start with at most 8 relevant source files and expand only with evidence.
- Prefer symbol search, focused ranges, `git diff --stat`, and one representative error per root cause.
- Never paste full logs, entire large files, generated output, backups, `.env`, credentials, or patient data.
- Use `scripts/ai-context-pack.ps1` for compact repository context.
- Use `scripts/ai-log-summary.ps1` before sharing large error logs.
- Token reduction never overrides clinical safety, RBAC, privacy, auditability, migration safety, or owner-approved Classic/Cockpit behavior.
