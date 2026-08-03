param(
  [string]$EnvFile = ".env.staging",
  [string]$ComposeProject = "prij-clinic-staging"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Staging env file not found: $EnvFile. Create it from .env.staging.example and keep it out of Git."
}

if ($ComposeProject -notmatch '^prij-clinic-staging(?:-[a-z0-9-]+)?$') {
  throw "ComposeProject must be explicitly staging-scoped."
}

$envPath = (Resolve-Path -LiteralPath $EnvFile).Path
$env:STAGING_ENV_FILE = $envPath

npm run staging:env:check -- --EnvFile $envPath
if ($LASTEXITCODE -ne 0) {
  throw "Staging environment validation failed."
}

docker compose -f docker-compose.staging.yml --env-file $envPath -p $ComposeProject up -d --build
if ($LASTEXITCODE -ne 0) {
  throw "Staging Docker build or startup failed."
}

Write-Host "Staging stack started. Run npm run staging:health-check to verify health."
