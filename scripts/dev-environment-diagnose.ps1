$ErrorActionPreference = "Continue"

function Section {
  param([string]$Title)
  Write-Host ""
  Write-Host "=== $Title ==="
}

function Report-Command {
  param(
    [string]$Label,
    [string]$Command,
    [string[]]$Arguments = @()
  )
  $cmd = Get-Command $Command -ErrorAction SilentlyContinue
  if (-not $cmd) {
    Write-Host "${Label}: unavailable"
    return
  }
  try {
    $output = & $Command @Arguments 2>&1
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
      Write-Host "${Label}: command exited $LASTEXITCODE"
    }
    if ($output) {
      $output | Select-Object -First 8 | ForEach-Object { Write-Host "  $_" }
    } else {
      Write-Host "${Label}: available"
    }
  } catch {
    Write-Host "${Label}: $($_.Exception.Message)"
  }
}

function Test-Port {
  param([int]$Port)
  try {
    $connection = Test-NetConnection -ComputerName "127.0.0.1" -Port $Port -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
      Write-Host "port ${Port}: listening"
    } else {
      Write-Host "port ${Port}: not reachable"
    }
  } catch {
    Write-Host "port ${Port}: check failed - $($_.Exception.Message)"
  }
}

function Test-Endpoint {
  param(
    [string]$Label,
    [string]$Url
  )
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    Write-Host "${Label}: HTTP $($response.StatusCode) $Url"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status) {
      Write-Host "${Label}: HTTP $status $Url"
    } else {
      Write-Host "${Label}: unavailable - $($_.Exception.Message)"
    }
  }
}

Section "Repository"
Write-Host "current directory: $(Get-Location)"
Report-Command "git branch" "git" @("branch", "--show-current")
Report-Command "git status short" "git" @("status", "--short")

Section "Runtime"
Report-Command "node version" "node" @("--version")
Report-Command "npm version" "npm" @("--version")

Section "Docker"
Report-Command "docker cli" "docker" @("--version")
Report-Command "docker daemon" "docker" @("info")
Report-Command "docker compose" "docker" @("compose", "version")
Report-Command "postgres container status" "docker" @("compose", "ps", "postgres")

Section "Ports"
Test-Port 3000
Test-Port 3001
Test-Port 5432

Section "Node Processes"
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
  $nodeProcesses | Select-Object Id, ProcessName, Path, StartTime | Format-Table -AutoSize
} else {
  Write-Host "stale node processes: none detected"
}

Section "Health Endpoints"
$apiUrl = ($env:API_URL)
if (-not $apiUrl) { $apiUrl = "http://localhost:3001" }
$apiUrl = $apiUrl.TrimEnd("/")
Test-Endpoint "API health" "$apiUrl/health"
Test-Endpoint "DB health" "$apiUrl/health/db"

Section "Local Environment Files"
foreach ($path in @(".env", "apps/api/.env")) {
  if (Test-Path $path) {
    Write-Host "${path}: present (values not printed)"
  } else {
    Write-Host "${path}: missing"
  }
}

Section "Prisma Client"
foreach ($path in @("apps/api/node_modules/.prisma/client", "node_modules/.prisma/client", "node_modules/@prisma/client")) {
  if (Test-Path $path) {
    Write-Host "${path}: present"
  } else {
    Write-Host "${path}: missing"
  }
}

Section "Suggested Next Commands"
Write-Host "docker compose up -d postgres"
Write-Host "npm run prisma:repair"
Write-Host "npm run prisma:seed"
Write-Host "npm run dev"
Write-Host "npm run test:v093:release"
Write-Host ""
Write-Host "Diagnostic complete. Docker/API blockers above do not mean the sprint failed; they mean DB/API validation must be rerun when Docker/PostgreSQL is reachable."
