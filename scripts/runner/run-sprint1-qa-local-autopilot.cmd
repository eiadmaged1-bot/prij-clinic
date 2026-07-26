@echo off
setlocal
cd /d C:\Newfolder\prij-clinic

echo ===== Fetch latest SECTRA controls =====
git fetch origin security/rbac-scope-enforcement
if errorlevel 1 goto :failed

git show origin/security/rbac-scope-enforcement:scripts/runner/run-qa-medication-structured-rx-local.ps1 > "%TEMP%\prij-qa-med-rx.ps1"
if errorlevel 1 goto :failed

git show origin/security/rbac-scope-enforcement:scripts/runner/run-feature47-severity-evolution-local.ps1 > "%TEMP%\prij-feature47.ps1"
if errorlevel 1 goto :failed

git show origin/security/rbac-scope-enforcement:scripts/runner/run-sprint1-evidence-audit-local.ps1 > "%TEMP%\prij-sprint1-audit.ps1"
if errorlevel 1 goto :failed

echo.
echo ===== Package 3 and 4: medication cards plus structured prescription =====
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\prij-qa-med-rx.ps1"
if errorlevel 1 goto :failed

echo.
echo ===== Feature 47: complaint severity evolution =====
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\prij-feature47.ps1"
if errorlevel 1 goto :failed

echo.
echo ===== Remaining Sprint 1 evidence audit =====
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\prij-sprint1-audit.ps1"
if errorlevel 1 goto :failed

echo.
echo SPRINT 1 QA AUTOPILOT AND EVIDENCE AUDIT VERIFIED AND PUSHED.
exit /b 0

:failed
echo.
echo SECTRA AUTOPILOT STOPPED AT THE FIRST FAILED STEP.
echo Keep this window open and send the final error lines.
pause
exit /b 1
