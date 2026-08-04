---
name: compact-handoff
description: Produce a small reusable handoff between ChatGPT, Codex, and human reviewers without repeating repository history or raw logs.
---

# Compact Handoff

Use this skill whenever a task pauses, changes agent, or needs review.

## Required format

Keep the handoff under 500 words unless the owner asks for detail.

- Task: one sentence.
- Repository and branch.
- Scope: files or modules intentionally touched.
- Decision: what was chosen and why.
- Changes: concise file list.
- Verification: exact commands and pass/fail.
- Remaining: blockers, risks, or next action.

## Compression rules

- Link or name artifacts; do not paste their full content.
- Include only the first representative error for each root cause.
- Replace long diffs with `git diff --stat` and focused hunks.
- Do not repeat stable project rules already present in `AGENTS.md`.
- Never include `.env`, credentials, patient data, full database dumps, or long generated output.
- Preserve encounter IDs and security findings only when required for the active task and safe to share.
