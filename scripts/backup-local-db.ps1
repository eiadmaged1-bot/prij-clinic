param(
  [string]$OutputDirectory = "backups"
)

$ErrorActionPreference = "Stop"

if ($env:CI -eq "true") {
  throw "Refusing to run local backup script in CI."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $repoRoot $OutputDirectory
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $backupDir "prij-clinic-local-$timestamp.sql"
$checksumPath = "$backupPath.sha256"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

docker compose up -d postgres | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw "Failed to start or verify local Postgres container."
}

$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
  docker exec prij-clinic-postgres pg_isready -U prij_clinic_dev -d prij_clinic_dev *> $null
  if ($LASTEXITCODE -eq 0) {
    break
  }
  Start-Sleep -Seconds 2
}

docker exec prij-clinic-postgres pg_isready -U prij_clinic_dev -d prij_clinic_dev *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Local Postgres did not become ready."
}

$dump = docker exec prij-clinic-postgres pg_dump -U prij_clinic_dev -d prij_clinic_dev --no-owner --no-acl
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed."
}

$dump | Set-Content -LiteralPath $backupPath -Encoding utf8
$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $backupPath
$hash.Hash | Set-Content -LiteralPath $checksumPath -Encoding ascii

Write-Host "Local database backup created:"
Write-Host $backupPath
Write-Host "SHA256 checksum:"
Write-Host $hash.Hash
Write-Host "Checksum file:"
Write-Host $checksumPath
Write-Host "Backups are ignored by git. Do not commit backup files."
