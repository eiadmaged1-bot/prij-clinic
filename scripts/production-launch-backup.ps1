param(
  [string]$OutputRoot = ""
)

$ErrorActionPreference = "Stop"

if (-not $OutputRoot) {
  $OutputRoot = Join-Path (Split-Path -Parent (Get-Location)) "prij-production-launch-backups"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $OutputRoot "production-launch-$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$databaseBackupPath = Join-Path $backupDir "database.backup.sql"
$uploadedFilesBackupPath = Join-Path $backupDir "uploaded-files-manifest.json"
$manifestPath = Join-Path $backupDir "backup-manifest.json"

@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  databaseBackupPath = $databaseBackupPath
  uploadedFilesBackupPath = $uploadedFilesBackupPath
  databaseFingerprint = $env:PRODUCTION_LAUNCH_DATABASE_FINGERPRINT
  note = "This wrapper creates an outside-source backup location and manifest. Run pg_dump/upload-file backup tooling according to the production database host policy, then set the fingerprint from the reset plan."
} | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $manifestPath

"Backup files must be produced outside the Git source tree." | Set-Content -Encoding UTF8 $databaseBackupPath
@{ generatedAt = (Get-Date).ToUniversalTime().ToString("o"); note = "Replace with uploaded-file backup inventory from production storage." } | ConvertTo-Json | Set-Content -Encoding UTF8 $uploadedFilesBackupPath

Write-Host "PRODUCTION-LAUNCH-BACKUP manifest=$manifestPath"
Write-Host "PRODUCTION-LAUNCH-BACKUP databaseBackupPath=$databaseBackupPath"
Write-Host "PRODUCTION-LAUNCH-BACKUP uploadedFilesBackupPath=$uploadedFilesBackupPath"
