param(
  [string]$BackupDirectory = "backups"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $repoRoot $BackupDirectory

Write-Host "Checking local backup readiness."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is required for the local backup workflow. Install Docker Desktop and start it before running backup:local."
}

docker compose ps postgres *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Local Postgres service is not available. Run npm run backup:local when the local Docker profile is configured."
}

docker exec prij-clinic-postgres pg_dump --version *> $null
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump is missing from the local Postgres container. Install PostgreSQL client tools or rebuild the local Postgres service image."
}

if (-not (Test-Path -LiteralPath $backupDir)) {
  Write-Host "Backup directory does not exist yet. It will be created by backup:local."
} else {
  $latest = Get-ChildItem -LiteralPath $backupDir -File -Include "*.backup.sql","*.dump","*.sql.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($latest) {
    Write-Host "Latest ignored backup artifact found:"
    Write-Host $latest.Name
  } else {
    Write-Host "No backup artifact found yet. Run npm run backup:local to create one."
  }
}

Write-Host "Backup verify completed. No restore was run."
