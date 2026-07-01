# Medication Data Recovery Decision

## Decision

Recover official medication rows only from approved project artifacts or owner-provided official files. Do not recreate rows from memory, examples, AI output, retail pages, or incomplete documentation.

## v0.9.9 Outcome

The v0.9.9 provenance recovery found historical Git evidence of the official medication work and restore tooling, but no recoverable raw official export or old DB container with the expected 8,269 official rows.

Current local DB remains:

- Official medication rows: 0
- Verified medication rows: 0

## Import Policy

Import is allowed only when a reviewed recovered export exists at:

```powershell
storage/medication-provenance-recovery/official-medication-recovered.jsonl
```

Required sequence:

```powershell
npm run medication:v098:validate-candidate -- --file "storage/medication-provenance-recovery/official-medication-recovered.jsonl"
npm run medication:v099:import-recovered:dry-run
$env:APP_ENV="local"
npm run medication:v099:import-recovered:apply
```

Do not claim strict medication readiness until official rows exist and strict checks pass.
