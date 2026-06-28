$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

function Assert-LocalDemoEnvironment {
  $appEnv = $env:APP_ENV
  $nodeEnv = $env:NODE_ENV
  $ci = $env:CI

  if ($ci -eq "true") {
    throw "Refusing to run demo reset in CI."
  }

  if ($appEnv -in @("production", "staging")) {
    throw "Refusing to run demo reset when APP_ENV=$appEnv."
  }

  if ($nodeEnv -eq "production") {
    throw "Refusing to run demo reset when NODE_ENV=production."
  }
}

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

Assert-LocalDemoEnvironment

Write-Host "DEMO RESET WARNING:" -ForegroundColor Yellow
Write-Host "This command is local/dev only. It does not delete data, reset the database, remove migrations, or run docker compose down -v." -ForegroundColor Yellow
Write-Host "It stops local dev ports, repairs Prisma Client, and reruns the idempotent demo seed." -ForegroundColor Yellow

Invoke-RepoCommand @("npm", "run", "dev:stop")
Invoke-RepoCommand @("npm", "run", "prisma:repair")
Invoke-RepoCommand @("npm", "run", "prisma:seed")

Write-Host "Demo setup refreshed with idempotent seed data. Existing non-seed local records were not deleted." -ForegroundColor Green
