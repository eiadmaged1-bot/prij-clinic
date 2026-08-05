$ErrorActionPreference = "Continue"

$app = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path (Join-Path $app "package.json"))) {
    Write-Host "Prij source folder is invalid: $app" -ForegroundColor Red
    exit 1
}

Set-Location $app

Write-Host "Stopping Prij website and backend..." -ForegroundColor Cyan
npm run dev:stop

Write-Host "Stopping the Prij PostgreSQL service..." -ForegroundColor Cyan
docker compose stop postgres

Write-Host "Prij Clinic stopped safely." -ForegroundColor Green
Start-Sleep -Seconds 2
