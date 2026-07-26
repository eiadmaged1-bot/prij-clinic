@echo off
setlocal
cd /d C:\Newfolder\prij-clinic
git fetch origin security/rbac-scope-enforcement
if errorlevel 1 exit /b 1
git show origin/security/rbac-scope-enforcement:scripts/runner/run-qa-medication-structured-rx-local.ps1 > "%TEMP%\run-qa-medication-structured-rx-local.ps1"
if errorlevel 1 exit /b 1
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\run-qa-medication-structured-rx-local.ps1"
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
  echo.
  echo SECTRA QA package failed. Keep this window open and send the last error.
  pause
)
exit /b %EXITCODE%
