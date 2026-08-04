---
name: context-budget
description: Minimize token use for PRIJ Clinic tasks by loading only the smallest relevant context, compressing evidence, and stopping scope expansion.
---

# Context Budget

Use this skill at the start of every coding, review, debugging, or handoff task.

## Workflow

1. State the target in one sentence.
2. Identify the smallest likely file set. Start with at most 8 files.
3. Prefer `rg`, `git grep`, `git diff --name-only`, and symbol searches before opening files.
4. Read only relevant ranges or functions. Do not read whole large files unless necessary.
5. Group repeated compiler or runtime errors by root cause. Show one representative error per group.
6. Expand scope only when evidence proves the current set is insufficient.
7. Finish with a compact result: changed files, commands run, result, remaining risk.

## Hard limits

- Never dump full logs when a filtered summary is enough.
- Never load `.env`, secrets, generated output, `node_modules`, build artifacts, backups, or patient data.
- Do not re-read unchanged files already summarized in the current task.
- Do not explore unrelated modules.
- Prefer one verified root cause over many speculative fixes.
- Ask at most one blocking clarification question.

## PRIJ safety

Token reduction never overrides clinical safety, RBAC, privacy, auditability, migration safety, or owner-approved Classic/Cockpit behavior.
