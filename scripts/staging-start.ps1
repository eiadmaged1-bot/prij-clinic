param(
  [string]$EnvFile = ".env.staging"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Staging env file not found: $EnvFile. Create it from .env.staging.example and keep it out of Git."
}

npm run staging:env:check -- --EnvFile $EnvFile
docker compose -f docker-compose.staging.yml --env-file $EnvFile up -d --build
Write-Host "Staging stack started. Run npm run staging:health-check to verify health."
