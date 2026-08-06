$ErrorActionPreference = "Continue"

$app = Split-Path -Parent $PSScriptRoot
$container = "prij-clinic-postgres"

if (-not (Test-Path (Join-Path $app "package.json"))) {
    throw "Prij source folder is invalid: $app"
}

Set-Location $app

Write-Host "PRIJ SAFE STATUS" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host "Folder: $app"

$branch = (git branch --show-current 2>$null).Trim()
$commit = (git rev-parse --short HEAD 2>$null).Trim()
$tracking = (git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null).Trim()

Write-Host "Branch: $branch"
Write-Host "Commit: $commit"
Write-Host "Tracking: $tracking"

$changes = @(git status --porcelain 2>$null)
if ($changes.Count -eq 0) {
    Write-Host "Working tree: CLEAN" -ForegroundColor Green
}
else {
    Write-Host "Working tree: LOCAL CHANGES PRESENT" -ForegroundColor Yellow
    git status --short
}

Write-Host ""
Write-Host "Docker" -ForegroundColor Cyan
Write-Host "------" -ForegroundColor Cyan

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Desktop: NOT AVAILABLE" -ForegroundColor Red
}
else {
    Write-Host "Docker Desktop: RUNNING" -ForegroundColor Green

    $containerStatus = docker inspect --format "{{.State.Status}}" $container 2>$null
    $containerHealth = docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}not-configured{{end}}" $container 2>$null

    if ($containerStatus) {
        Write-Host "PostgreSQL container: $containerStatus"
        Write-Host "PostgreSQL health: $containerHealth"

        $mounts = docker inspect --format "{{range .Mounts}}{{.Name}} -> {{.Destination}}{{println}}{{end}}" $container 2>$null
        if ($mounts) {
            Write-Host "Mounted storage:"
            Write-Host $mounts
        }
    }
    else {
        Write-Host "PostgreSQL container: NOT FOUND" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Ports" -ForegroundColor Cyan
Write-Host "-----" -ForegroundColor Cyan

foreach ($port in @(3000, 3001, 5432)) {
    $listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Host "Port ${port}: LISTENING" -ForegroundColor Green
    }
    else {
        Write-Host "Port ${port}: CLOSED"
    }
}

Write-Host ""
Write-Host "Database identity and counts (read-only)" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

if ($containerStatus -eq "running") {
    @'
SELECT current_database() AS database, current_schema() AS schema;
SELECT 'users' AS item, COUNT(*)::text AS count FROM "User"
UNION ALL
SELECT 'patients', COUNT(*)::text FROM "Patient"
UNION ALL
SELECT 'patient_documents', COUNT(*)::text FROM "PatientDocument"
ORDER BY item;
'@ | docker exec -i $container psql -U prij_clinic_dev -d prij_clinic_dev
}
else {
    Write-Host "Database count check skipped because PostgreSQL is not running."
}

Write-Host ""
Write-Host "Login URL: http://localhost:3000/login"
Write-Host "This command did not modify Git, dependencies, files, or the database." -ForegroundColor Green
