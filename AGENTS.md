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

## Token-efficient behavior
- Use `.agents/skills/token-efficiency/SKILL.md` for every coding task.
- Search before reading whole files.
- Load only the smallest relevant file ranges.
- Reuse prior findings instead of reopening the same files.
- Change the minimum number of files.
- Run the narrowest relevant test first.
- Stop when the requested acceptance criteria pass.
- Never load or send `.env`, secrets, patient data, database dumps, generated output, or unrelated large files.

## Behavior
Before editing files, explain the plan.
After editing files, summarize exactly what changed.
When possible, run tests or type checks.
Do not install large dependencies without asking.
Do not use dangerous/full-access mode.