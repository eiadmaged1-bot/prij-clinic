---
name: targeted-retrieval
description: Find the exact PRIJ Clinic code needed for a task without loading the whole repository or repeating large context.
---

# Targeted Retrieval

Use this skill before opening source files.

## Search order

1. `git status --short` and `git diff --name-only`.
2. `rg -n "<symbol|route|error>" apps scripts package.json`.
3. Open the smallest matching file ranges.
4. Follow direct imports only when required.
5. Stop after the root cause and affected boundary are proven.

## Domain routing

- UI: route, direct components, styles, and relevant API client only.
- API: controller, service, DTO, guard, and directly used Prisma model only.
- Prisma errors: inspect `apps/api/prisma/schema.prisma`, generator output, and one representative compiler error before touching services.
- RBAC: inspect guard/policy helpers and targeted tests; never infer authorization from UI visibility.
- Classic/Cockpit: inspect shared encounter state and the selected workspace renderer; do not redesign unrelated patient pages.

## Output compression

- Deduplicate repeated errors by error code and missing symbol.
- Report file paths and line numbers instead of pasting full files.
- Use `git diff --stat` plus focused hunks instead of a full diff.
- Keep the initial evidence pack under 120 lines.
