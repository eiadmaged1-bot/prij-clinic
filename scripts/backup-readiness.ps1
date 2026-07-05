$ErrorActionPreference = "Stop"

Write-Host "Prij Clinic backup readiness"
Write-Host "- Local backups write to the ignored backups/ folder."
Write-Host "- backup:verify checks tooling only and does not run a restore."
Write-Host "- Destructive restore is never run automatically by this readiness workflow."
Write-Host "- Do not commit generated backup files."

powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\backup-verify.ps1"
