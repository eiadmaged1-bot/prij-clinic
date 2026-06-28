param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$MigrationName
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $repoRoot "apps/api"
$rootEnv = Join-Path $repoRoot ".env"
$apiEnv = Join-Path $apiDir ".env"

function Invoke-RepoCommand {
  param([string[]]$Command)

  Push-Location $repoRoot
  try {
    & $Command[0] @($Command | Select-Object -Skip 1)
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed: $($Command -join ' ')"
    }
  } finally {
    Pop-Location
  }
}

function Wait-PostgresReady {
  $deadline = (Get-Date).AddSeconds(60)

  while ((Get-Date) -lt $deadline) {
    docker exec prij-clinic-postgres pg_isready -U prij_clinic_dev -d prij_clinic_dev *> $null
    if ($LASTEXITCODE -eq 0) {
      return
    }

    Start-Sleep -Seconds 2
  }

  throw "Postgres did not become ready within 60 seconds."
}

Push-Location $repoRoot
try {
  npm run dev:stop
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to stop local dev ports."
  }

  docker compose up -d postgres
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to start or verify postgres."
  }

  Wait-PostgresReady

  docker exec prij-clinic-postgres psql -U prij_clinic_dev -d prij_clinic_dev -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'prij_clinic_dev' AND pid <> pg_backend_pid();" | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to terminate active prij_clinic_dev connections."
  }

  if (-not (Test-Path $rootEnv)) {
    throw "Root .env file is required for local Prisma migration."
  }

  Copy-Item -LiteralPath $rootEnv -Destination $apiEnv -Force

  Push-Location $apiDir
  try {
    $env:PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = "1"
    npx prisma migrate dev --name $MigrationName --skip-generate --skip-seed
    if ($LASTEXITCODE -ne 0) {
      throw "Prisma migrate dev failed."
    }
  } finally {
    Remove-Item Env:\PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK -ErrorAction SilentlyContinue
    Pop-Location
  }

  Invoke-RepoCommand @("npm", "run", "prisma:generate")
} finally {
  Pop-Location
}

