param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$app = Split-Path -Parent $PSScriptRoot
$expectedBranch = "current/known-good-pre-impeccable"
$loginUrl = "http://localhost:3000/login"

if (-not (Test-Path (Join-Path $app "package.json"))) {
    throw "Prij source folder is invalid: $app"
}

Set-Location $app

$currentBranch = (git branch --show-current 2>$null).Trim()
$currentCommit = (git rev-parse --short HEAD 2>$null).Trim()

Write-Host "Prij Clinic safe launcher" -ForegroundColor Cyan
Write-Host "Folder:  $app"
Write-Host "Branch:  $currentBranch"
Write-Host "Commit:  $currentCommit"

if ($currentBranch -and $currentBranch -ne $expectedBranch) {
    Write-Host "WARNING: expected branch '$expectedBranch'. No branch was changed automatically." -ForegroundColor Yellow
}

if (-not (Test-Path (Join-Path $app "node_modules"))) {
    throw "Dependencies are not installed. Run the approved setup workflow once; normal launch must not run npm install or npm ci."
}

Write-Host "Checking Docker Desktop..." -ForegroundColor Cyan
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker is unavailable. Open Docker Desktop and wait until it is running."
}

Write-Host "Starting the preserved Prij PostgreSQL service..." -ForegroundColor Cyan
docker compose up -d postgres
if ($LASTEXITCODE -ne 0) {
    throw "Docker could not start the Prij PostgreSQL service."
}

$containerName = "prij-clinic-postgres"
$databaseReady = $false

for ($attempt = 1; $attempt -le 30; $attempt++) {
    $health = docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}" $containerName 2>$null

    if ($health -eq "healthy" -or $health -eq "running") {
        $databaseReady = $true
        break
    }

    Start-Sleep -Seconds 2
}

if (-not $databaseReady) {
    throw "The Prij PostgreSQL container did not become ready."
}

Write-Host "Stopping stale Prij development processes..." -ForegroundColor Cyan
npm run dev:stop 2>$null

$escapedApp = $app.Replace("'", "''")
$backendCommand = "Set-Location -LiteralPath '$escapedApp'; npm run dev:api"
$webCommand = "Set-Location -LiteralPath '$escapedApp'; npm run dev:web"

Write-Host "Starting backend API on port 3001..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-Command", $backendCommand
)

Start-Sleep -Seconds 4

Write-Host "Starting website on port 3000..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-Command", $webCommand
)

Write-Host "Waiting for Prij Clinic..." -ForegroundColor Cyan
$ready = $false

for ($attempt = 1; $attempt -le 40; $attempt++) {
    try {
        $response = Invoke-WebRequest -Uri $loginUrl -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            $ready = $true
            break
        }
    }
    catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $NoBrowser) {
    Start-Process $loginUrl
}

if ($ready) {
    Write-Host "Prij Clinic is running from the approved safe working folder." -ForegroundColor Green
}
else {
    Write-Host "The browser was opened, but Prij may need more time. Keep both PowerShell windows open." -ForegroundColor Yellow
}
