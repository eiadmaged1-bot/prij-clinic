# PRIJ Clinic AI Token Budget

This workflow reduces repeated context sent to Codex and ChatGPT-compatible review flows. It does not change platform billing or model-side token accounting.

## Project skills

- `context-budget`: limit file loading, deduplicate errors, and prevent scope expansion.
- `targeted-retrieval`: search symbols and direct dependencies before reading files.
- `compact-handoff`: transfer only the active task state between agents.

Codex discovers project skills under `.agents/skills`.

## PowerShell helpers

Create a compact repository snapshot:

```powershell
./scripts/ai-context-pack.ps1
```

Summarize a large log before sharing it:

```powershell
./scripts/ai-log-summary.ps1 -Path ".codex-logs/dev.err.log"
```

Review generated output before pasting it into any assistant. Never share secrets, `.env` contents, credentials, real patient data, database dumps, or authentication files.

## Default operating limits

- Start with no more than 8 source files.
- Keep initial evidence under 120 lines.
- Send one representative error per root cause.
- Use focused diffs, not complete repository dumps.
- Reuse the compact handoff instead of repeating project history.
- Expand context only when evidence proves it is necessary.

## Safety precedence

Clinical safety, privacy, RBAC, auditability, migration safety, and owner-approved Classic/Cockpit behavior always override token savings.
