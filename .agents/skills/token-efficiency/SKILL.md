# Token Efficiency Skill

Use this skill for ChatGPT, Codex, and local coding agents working on PRIJ Clinic.

## Goal
Reduce context size, repeated reading, unnecessary tool calls, and broad code generation while preserving safety and correctness.

## Required workflow
1. Start from the smallest clearly defined task.
2. Read `AGENTS.md` once, then load only files directly related to the task.
3. Search before reading whole files.
4. Prefer symbol, function, route, and exact-string searches over repository-wide dumps.
5. Reuse previous findings instead of reopening the same files.
6. Summarize discoveries in a short working note before editing.
7. Change the minimum number of files.
8. Run the narrowest relevant test first; expand only when needed.
9. Stop when the requested acceptance criteria pass.
10. Report changed files, tests, unresolved risks, and no extra narrative.

## Context budget rules
- Do not load generated files, build output, dependency folders, logs, screenshots, database dumps, or large fixtures unless directly required.
- Do not paste full files when a small line range or diff is enough.
- Do not ask multiple agents to inspect the same scope unless independent review is explicitly required.
- Do not run broad architecture or design reviews for isolated low-risk fixes.
- Do not regenerate plans after every step; update the existing plan.
- Prefer compact diffs and structured summaries.

## Routing
- Local agent: isolated CSS, copy, spacing, small UI bugs, focused tests.
- Codex: RBAC, Prisma, migrations, auth, encounter lifecycle, queue state, security, medical-data integrity, shared architecture.
- Council review: cross-department changes, clinical risk, irreversible data changes, major UI replacement, release decisions.

## Recommended external tools
These are optional and must be reviewed before installation:
- Repomix: compact repository snapshots for bounded review.
- Serena: semantic symbol-level code navigation and edits.
- Aider repository map concepts: concise structural context.
- Context Mode: context compression and tool-output control.

Never send secrets, `.env` contents, real patient data, database dumps, or private clinical records to external services.
