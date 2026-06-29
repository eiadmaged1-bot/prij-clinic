param(
  [string]$EnvFile = ".env.staging"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Staging env file not found: $EnvFile. Create it from .env.staging.example and keep it out of Git."
}

$values = @{}
Get-Content -LiteralPath $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) {
    return
  }

  $separator = $line.IndexOf("=")
  if ($separator -lt 1) {
    return
  }

  $key = $line.Substring(0, $separator).Trim()
  $value = $line.Substring($separator + 1).Trim().Trim('"').Trim("'")
  $values[$key] = $value
}

$errors = New-Object System.Collections.Generic.List[string]

function Require-Key([string]$Name) {
  if (-not $values.ContainsKey($Name) -or [string]::IsNullOrWhiteSpace($values[$Name])) {
    $errors.Add("$Name is required.")
  }
}

@(
  "APP_ENV",
  "NODE_ENV",
  "API_PORT",
  "API_URL",
  "APP_URL",
  "NEXT_PUBLIC_API_URL",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "AI_FEATURES_ENABLED",
  "AI_PROVIDER",
  "SEED_DEMO_DATA",
  "SEED_DEMO_OWNER",
  "DEMO_OWNER_EMAIL",
  "DEMO_OWNER_PASSWORD",
  "DEMO_ADMIN_PASSWORD",
  "DEMO_TEST_PASSWORD",
  "POSTGRES_DB",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD"
) | ForEach-Object { Require-Key $_ }

if ($values["APP_ENV"] -ne "staging") {
  $errors.Add("APP_ENV must be staging for the local staging trial.")
}

if ($values["NODE_ENV"] -ne "production") {
  $errors.Add("NODE_ENV must be production for staging image behavior.")
}

if ($values["AI_FEATURES_ENABLED"] -ne "false") {
  $errors.Add("AI_FEATURES_ENABLED must be false.")
}

if ($values["AI_PROVIDER"] -ne "disabled") {
  $errors.Add("AI_PROVIDER must be disabled.")
}

if ($values["SEED_DEMO_DATA"] -ne "true") {
  $errors.Add("SEED_DEMO_DATA must be true for this fake-data-only local staging trial.")
}

if ($values["SEED_DEMO_OWNER"] -ne "true") {
  $errors.Add("SEED_DEMO_OWNER must be true for staging demo login tests.")
}

$jwtSecret = $values["JWT_SECRET"]
if ($jwtSecret -and $jwtSecret.Length -lt 32) {
  $errors.Add("JWT_SECRET must be at least 32 characters.")
}

$forbiddenPasswords = @("eyad", "LocalDev123!")
foreach ($key in @("DEMO_OWNER_PASSWORD", "DEMO_ADMIN_PASSWORD", "DEMO_TEST_PASSWORD")) {
  if ($forbiddenPasswords -contains $values[$key]) {
    $errors.Add("$key must not use a local demo password.")
  }
}

foreach ($key in @("JWT_SECRET", "DATABASE_URL", "POSTGRES_PASSWORD")) {
  if ($values[$key] -match "replace-with|<|>|STAGING_PASSWORD|PRODUCTION_PASSWORD") {
    $errors.Add("$key still appears to contain a placeholder.")
  }
}

if ($errors.Count -gt 0) {
  Write-Host "Staging env check failed:" -ForegroundColor Red
  foreach ($errorItem in $errors) {
    Write-Host "- $errorItem" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Staging env check passed. Required values are present and no secret values were printed." -ForegroundColor Green
