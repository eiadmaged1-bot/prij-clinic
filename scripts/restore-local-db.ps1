param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,

  [string]$ConfirmRestore
)

$ErrorActionPreference = "Stop"

if ($env:CI -eq "true") {
  throw "Refusing to run local restore script in CI."
}

if ($env:NODE_ENV -eq "production") {
  throw "Refusing to run local restore script with NODE_ENV=production."
}

if ($ConfirmRestore -ne "LOCAL_RESTORE") {
  throw "Restore is intentionally guarded. Re-run with -ConfirmRestore LOCAL_RESTORE after verifying this is a local/dev database."
}

$resolvedBackup = Resolve-Path -LiteralPath $BackupFile -ErrorAction Stop

Write-Host "WARNING: This will apply SQL from the backup file to the local development database."
Write-Host "It does not delete Docker volumes and must never be used against production data."
Write-Host "Backup file: $resolvedBackup"

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

Get-Content -LiteralPath $resolvedBackup -Raw | docker exec -i prij-clinic-postgres psql -U prij_clinic_dev -d prij_clinic_dev -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) {
  throw "Local restore failed."
}

Write-Host "Local restore command completed. Run verification checks before using the restored local database."
