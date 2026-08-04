param(
  [string]$Root = ".",
  [int]$MaxChangedFiles = 20
)

$ErrorActionPreference = "Stop"
Set-Location $Root

function Section([string]$Title) {
  "`n=== $Title ==="
}

Section "Repository"
git rev-parse --show-toplevel
git branch --show-current
git log -1 --pretty=format:"%h | %ad | %s" --date=iso

Section "Working tree"
$status = @(git status --short)
if ($status.Count -eq 0) { "clean" } else { $status | Select-Object -First $MaxChangedFiles }

Section "Changed files"
$files = @(
  git diff --name-only
  git diff --cached --name-only
) | Where-Object { $_ } | Sort-Object -Unique
if ($files.Count -eq 0) { "none" } else { $files | Select-Object -First $MaxChangedFiles }

Section "Diff summary"
$stat = git diff --stat
if ($LASTEXITCODE -eq 0 -and $stat) { $stat } else { "none" }

Section "Useful package scripts"
if (Test-Path "package.json") {
  $package = Get-Content "package.json" -Raw | ConvertFrom-Json
  $package.scripts.PSObject.Properties |
    Where-Object { $_.Name -match "dev|build|typecheck|lint|test|prisma|qa" } |
    Sort-Object Name |
    ForEach-Object { "{0}: {1}" -f $_.Name, $_.Value }
}

Section "Safety"
"Excluded: .env, credentials, patient data, node_modules, build artifacts, backups, and full logs."
