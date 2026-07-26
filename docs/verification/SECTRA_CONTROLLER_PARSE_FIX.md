# SECTRA Controller Parse Fix

- Scope: controller-only repair for `run-qa-medication-structured-rx-local.ps1`
- Root cause: escaped closing quotes in three verification-source strings caused a PowerShell parser failure.
- Application code changed: NO
- Production data changed: NO
- Migration/seed/reset/delete/truncate: NOT RUN
- Secrets exposed: NO
- Execution target: SECTRA/local only
