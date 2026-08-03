param(
  [string]$EnvFile = ".env.staging",
  [string]$ComposeProject = "prij-clinic-staging",
  [switch]$RemoveVolumes
)

$ErrorActionPreference = "Stop"

if ($RemoveVolumes) {
  throw "Refusing to remove staging volumes. Use non-destructive stop only for this sprint."
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Staging env file not found: $EnvFile."
}

if ($ComposeProject -notmatch '^prij-clinic-staging(?:-[a-z0-9-]+)?$') {
  throw "Refusing to stop a Compose project whose name is not explicitly staging-scoped."
}

$envPath = (Resolve-Path -LiteralPath $EnvFile).Path
$env:STAGING_ENV_FILE = $envPath

npm run staging:env:check -- --EnvFile $envPath
if ($LASTEXITCODE -ne 0) {
  throw "Staging environment validation failed. Refusing to stop the stack."
}

docker compose -f docker-compose.staging.yml --env-file $envPath -p $ComposeProject stop
if ($LASTEXITCODE -ne 0) {
  throw "Staging Docker stop failed."
}

Write-Host "Staging stack stopped without deleting volumes."
