param(
    [string]$Branch = "current/known-good-pre-impeccable"
)

$ErrorActionPreference = "Stop"

$app = Split-Path -Parent $PSScriptRoot
$remote = "origin"
$remoteRef = "refs/remotes/$remote/$Branch"
$localRef = "refs/heads/$Branch"

if (-not (Test-Path (Join-Path $app "package.json"))) {
    throw "Prij source folder is invalid: $app"
}

Set-Location $app

$insideWorkTree = (git rev-parse --is-inside-work-tree 2>$null).Trim()
if ($insideWorkTree -ne "true") {
    throw "Prij folder is not a valid Git working tree: $app"
}

$pendingChanges = @(git status --porcelain)
if ($pendingChanges.Count -gt 0) {
    Write-Host "Local changes detected. Nothing was fetched, switched, reset, or overwritten." -ForegroundColor Yellow
    git status --short
    throw "Commit or intentionally preserve the local changes before activating the safe branch."
}

Write-Host "Fetching the exact approved branch even when this clone uses a restricted fetch refspec..." -ForegroundColor Cyan
$fetchSpec = "+refs/heads/${Branch}:refs/remotes/${remote}/${Branch}"
git fetch $remote $fetchSpec --prune
if ($LASTEXITCODE -ne 0) {
    throw "Could not fetch $remote/$Branch."
}

$remoteCommit = (git rev-parse $remoteRef 2>$null).Trim()
if (-not $remoteCommit) {
    throw "Remote branch was not found after fetch: $remote/$Branch"
}

$localExists = $false
git show-ref --verify --quiet $localRef
if ($LASTEXITCODE -eq 0) {
    $localExists = $true
}

if ($localExists) {
    git switch $Branch
}
else {
    git switch --track -c $Branch $remoteRef
}

if ($LASTEXITCODE -ne 0) {
    throw "Could not switch to $Branch."
}

Write-Host "Applying remote updates using fast-forward only..." -ForegroundColor Cyan
git merge --ff-only $remoteRef
if ($LASTEXITCODE -ne 0) {
    throw "The local branch diverged from $remote/$Branch. No reset or force operation was performed."
}

$localCommit = (git rev-parse HEAD).Trim()

Write-Host "" 
Write-Host "Prij safe branch activated." -ForegroundColor Green
Write-Host "Folder: $app"
Write-Host "Branch: $Branch"
Write-Host "Commit: $localCommit"
Write-Host "Remote: $remoteCommit"
Write-Host "" 
Write-Host "No database migration, seed, restore, dependency installation, reset, or cleanup was run." -ForegroundColor Green
