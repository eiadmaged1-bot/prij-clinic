param(
  [string]$EnvFile = ".env.staging",
  [string]$OutputDirectory = "backups/staging",
  [string]$ComposeProject = "prij-clinic-staging"
)

$ErrorActionPreference = "Stop"

if ($env:CI -eq "true") {
  throw "Refusing to run staging backup script in CI."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot $EnvFile

if (-not (Test-Path -LiteralPath $envPath)) {
  throw "Staging env file was not found. Create it locally from .env.staging.example and do not commit it."
}

function Read-EnvFileValue {
  param([string]$Path, [string]$Name)

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $separator = $trimmed.IndexOf("=")
    if ($separator -lt 0) {
      continue
    }

    $key = $trimmed.Substring(0, $separator).Trim()
    if ($key -ne $Name) {
      continue
    }

    $value = $trimmed.Substring($separator + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    return $value
  }

  return $null
}

$appEnv = Read-EnvFileValue -Path $envPath -Name "APP_ENV"
$dbName = Read-EnvFileValue -Path $envPath -Name "POSTGRES_DB"
$dbUser = Read-EnvFileValue -Path $envPath -Name "POSTGRES_USER"

if ($appEnv -ne "staging") {
  throw "Refusing backup because APP_ENV is not staging."
}

if (-not $dbName -or -not $dbUser) {
  throw "POSTGRES_DB and POSTGRES_USER are required in the staging env file."
}

$backupDir = Join-Path $repoRoot $OutputDirectory
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $backupDir "prij-clinic-staging-$timestamp.sql"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml up -d postgres | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw "Failed to start or verify staging Postgres container."
}

$deadline = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $deadline) {
  docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres pg_isready -U $dbUser -d $dbName *> $null
  if ($LASTEXITCODE -eq 0) {
    break
  }
  Start-Sleep -Seconds 2
}

docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres pg_isready -U $dbUser -d $dbName *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Staging Postgres did not become ready."
}

$dump = docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres pg_dump -U $dbUser -d $dbName --no-owner --no-acl
if ($LASTEXITCODE -ne 0) {
  throw "Staging pg_dump failed."
}

$dump | Set-Content -LiteralPath $backupPath -Encoding utf8

Write-Host "Staging database backup created:"
Write-Host $backupPath
Write-Host "Backups are ignored by git. Encrypt before moving off the machine and do not commit backup files."
