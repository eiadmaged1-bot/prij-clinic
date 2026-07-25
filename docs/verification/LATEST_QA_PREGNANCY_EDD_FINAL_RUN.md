# Latest QA Pregnancy EDD Final Verify Run

- Run ID: `30177787218`
- Status: `completed`
- Conclusion: `failure`
- Head SHA: `4f8d2363d080bfa2b05a515ba843cc4b6b7e5e79`
- URL: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30177787218

## Run summary
```text

X security/rbac-scope-enforcement Prij Sprint 1 QA Pregnancy EDD Final Verify · 30177787218
Triggered via push about 12 minutes ago

JOBS
X Final verify pregnancy context and EDD package in 4m14s (ID 89729317975)
  ✓ Set up job
  ✓ Prepare isolated SECTRA workspace
  ✓ Checkout QA repair branch
  ✓ Setup Node 22
  ✓ Load local development configuration safely
  ✓ Install and prepare verification prerequisites
  ✓ Run all seven mandatory checks
  X Record verified QA Package 1
  ✓ Upload final diagnostics
  - Post Setup Node 22
  ✓ Post Checkout QA repair branch
  ✓ Complete job

ANNOTATIONS
requesting annotations returned 403 Forbidden as the token does not have sufficient permissions. Note that it is not currently possible to create a fine-grained PAT with the `checks:read` permission.

ARTIFACTS
qa-pregnancy-edd-final-30177787218

To see what failed, try: gh run view 30177787218 --log-failed
View this run on GitHub: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30177787218
```

## Failed log tail
```text
Final verify pregnancy context and EDD package	Record verified QA Package 1	﻿2026-07-25T22:44:06.8680455Z ##[group]Run $ErrorActionPreference = 'Stop'
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8680887Z ^[[36;1m$ErrorActionPreference = 'Stop'^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8681282Z ^[[36;1mNew-Item -ItemType Directory -Force 'docs/verification' | Out-Null^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8681645Z ^[[36;1m@(^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8681864Z ^[[36;1m  '# QA Pregnancy Context and EDD Verification',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8682148Z ^[[36;1m  '',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8682359Z ^[[36;1m  '- Tickets: `QA-PREG-001`, `QA-EDD-001`',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8682711Z ^[[36;1m  '- Pregnancy ordinary menstrual-cycle UI: SUPPRESSED',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8683102Z ^[[36;1m  '- Pre-pregnancy menstrual baseline: PRESERVED',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8683455Z ^[[36;1m  '- Pregnancy-specific bleeding fields: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8683752Z ^[[36;1m  '- EDD manual mode: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8684145Z ^[[36;1m  '- EDD calculated candidates (LMP, ultrasound, IVF/ET, known conception): PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8684680Z ^[[36;1m  '- Clinician confirmation and no-silent-overwrite guard: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8685119Z ^[[36;1m  '- Correction reason and dating history: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8685427Z ^[[36;1m  '- Locked contract test: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8686011Z ^[[36;1m  '- Feature 46 regression: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8686521Z ^[[36;1m  '- Clinical workflow regression: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8686825Z ^[[36;1m  '- Medication regression: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8687089Z ^[[36;1m  '- Search regression: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8687333Z ^[[36;1m  '- Typecheck: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8687565Z ^[[36;1m  '- Production build: PASS',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8687863Z ^[[36;1m  '- Migration/seed/reset/delete/truncate: NOT RUN',^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8688183Z ^[[36;1m  '- Production data modified: NO'^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8688640Z ^[[36;1m) | Set-Content -LiteralPath 'docs/verification/QA_PREGNANCY_EDD_RESULT.md' -Encoding utf8^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8689604Z ^[[36;1m^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8689869Z ^[[36;1m$batchPath = 'docs/verification/SPRINT1_QA_REPAIR_BATCH.md'^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8690268Z ^[[36;1m$batch = Get-Content -LiteralPath $batchPath -Raw^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8690638Z ^[[36;1mif (-not $batch.Contains('QA-PREG-001: VERIFIED')) {^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8691246Z ^[[36;1m  Add-Content -LiteralPath $batchPath -Value "`n## Verified packages`n`n- QA-PREG-001: VERIFIED`n- QA-EDD-001: VERIFIED`n"^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8691782Z ^[[36;1m}^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8691937Z ^[[36;1m^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8692137Z ^[[36;1mgit config user.name 'github-actions[bot]'^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8692566Z ^[[36;1mgit config user.email '41898282+github-actions[bot]@users.noreply.github.com'^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8693209Z ^[[36;1mgit add -- 'docs/verification/QA_PREGNANCY_EDD_RESULT.md' 'docs/verification/SPRINT1_QA_REPAIR_BATCH.md'^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8693709Z ^[[36;1mgit diff --cached --check^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8694105Z ^[[36;1mif ($LASTEXITCODE -ne 0) { throw 'Verification documents have diff-check errors.' }^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8694539Z ^[[36;1mif (git diff --cached --quiet) {^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8694918Z ^[[36;1m  Write-Host 'Verification documents already current; no commit needed.'^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8695287Z ^[[36;1m  exit 0^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8695452Z ^[[36;1m}^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8695791Z ^[[36;1mgit commit -m 'Verify pregnancy context guard and EDD provenance'^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8696286Z ^[[36;1mif ($LASTEXITCODE -ne 0) { throw 'Could not commit final QA verification.' }^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8696740Z ^[[36;1mgit push origin HEAD:work/sprint1-qa-repair-batch^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8697175Z ^[[36;1mif ($LASTEXITCODE -ne 0) { throw 'Could not push final QA verification.' }^[[0m
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8721427Z shell: C:\Windows\System32\WindowsPowerShell\v1.0\powershell.EXE -command ". '{0}'"
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8721844Z env:
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8722366Z   DATABASE_URL: ***localhost:5432/prij_clinic_dev
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8722668Z   JWT_SECRET: local-dev-secret-for-tests
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8724086Z   JWT_EXPIRES_IN: 1h
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8724397Z   AI_FEATURES_ENABLED: false
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8724609Z   AI_PROVIDER: disabled
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:06.8724792Z ##[endgroup]
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.1734966Z warning: in the working copy of 'docs/verification/SPRINT1_QA_REPAIR_BATCH.md', LF will be replaced by CRLF the next time Git touches it
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.4474101Z docs/verification/SPRINT1_QA_REPAIR_BATCH.md:20: new blank line at EOF.
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.5025083Z Verification documents have diff-check errors.
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.5025786Z At C:\Users\SuperUser\actions-runner\_work\_temp\12034e5e-a86c-4521-9f13-09f9bd17f70f.ps1:36 char:28
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.5026419Z + ... ODE -ne 0) { throw 'Verification documents have diff-check errors.' }
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.5026868Z +                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.5027455Z     + CategoryInfo          : OperationStopped: (Verification do...f-check errors.:String) [], RuntimeException
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.5028102Z     + FullyQualifiedErrorId : Verification documents have diff-check errors.
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.5028469Z  
Final verify pregnancy context and EDD package	Record verified QA Package 1	2026-07-25T22:44:07.5161038Z ##[error]Process completed with exit code 1.
```
