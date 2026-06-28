param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if ($env:CI -eq "true") {
  throw "Refusing to run local backup verification in CI."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backupRoot = Resolve-Path -LiteralPath (Join-Path $repoRoot "backups") -ErrorAction Stop
$resolvedBackup = Resolve-Path -LiteralPath $BackupFile -ErrorAction Stop
$backupPath = $resolvedBackup.Path

if (-not $backupPath.StartsWith($backupRoot.Path, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Backup file must be under the local backups directory."
}

if ($backupPath -notmatch 'prij-clinic-local-\d{8}-\d{6}\.sql$') {
  throw "Backup file name is not an expected local backup name: prij-clinic-local-YYYYMMDD-HHMMSS.sql"
}

$item = Get-Item -LiteralPath $backupPath
if ($item.Length -lt 1024) {
  throw "Backup file is unexpectedly small."
}

$head = Get-Content -LiteralPath $backupPath -TotalCount 20
if (($head -join "`n") -notmatch "PostgreSQL database dump|-- Dumped from database version") {
  throw "Backup file does not look like a pg_dump SQL backup."
}

if (Select-String -LiteralPath $backupPath -Pattern "DROP DATABASE|CREATE DATABASE" -Quiet) {
  throw "Backup contains database-level create/drop statements; expected a database-local plain SQL dump."
}

$checksumPath = "$backupPath.sha256"
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $backupPath).Hash

if (Test-Path -LiteralPath $checksumPath) {
  $expectedHash = (Get-Content -LiteralPath $checksumPath -Raw).Trim()
  if ($expectedHash -ne $actualHash) {
    throw "Backup checksum verification failed."
  }
  Write-Host "BACKUP VERIFY PASS checksum sidecar matches"
} else {
  Write-Host "BACKUP VERIFY WARN checksum sidecar is missing"
}

Write-Host "BACKUP VERIFY PASS file name, location, size, pg_dump header, and safety scan"
Write-Host "Backup file: $backupPath"
Write-Host "SHA256: $actualHash"
