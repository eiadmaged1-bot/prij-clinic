param(
  [Parameter(Mandatory=$true)][string]$BackupManifest,
  [switch]$IsolatedOnly
)

$ErrorActionPreference = "Stop"

if (-not $IsolatedOnly) {
  throw "Restore drill refused. Pass -IsolatedOnly and use a temporary isolated database, never the active clinic database."
}

$manifest = Get-Content -Raw $BackupManifest | ConvertFrom-Json
if (-not $manifest.databaseBackupPath -or -not $manifest.uploadedFilesBackupPath) {
  throw "Restore drill refused. Manifest must include databaseBackupPath and uploadedFilesBackupPath."
}

Write-Host "PRODUCTION-LAUNCH-RESTORE-DRILL verified manifest shape for isolated restore only."
Write-Host "PRODUCTION-LAUNCH-RESTORE-DRILL databaseBackupPath=$($manifest.databaseBackupPath)"
Write-Host "PRODUCTION-LAUNCH-RESTORE-DRILL uploadedFilesBackupPath=$($manifest.uploadedFilesBackupPath)"

