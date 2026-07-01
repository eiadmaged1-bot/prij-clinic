param(
  [string[]]$Roots = @("C:\Newfolder", "C:\Users\SuperUser", "C:\Users\eiadm"),
  [switch]$SkipDocker
)

$ErrorActionPreference = "Continue"
$reportDir = Join-Path (Get-Location) "storage\medication-provenance-recovery"
$jsonReport = Join-Path $reportDir "v099-provenance-report.json"
$mdReport = Join-Path $reportDir "v099-provenance-report.md"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$keywords = @(
  "official-medication", "official medication", "medication export", "drug-market",
  "restore", "source-recovery", "Bahrain", "Oman", "NHRA", "MOH",
  "export-official-medication-data", "restore-official-medication", "verify-official-medication"
)
$refNeedles = @(
  "medication", "drug-market", "restore", "official", "verification",
  "data/v0.8.5-medication-data-preservation-verification-source-recovery",
  "v0.8.5-medication-data-preservation-verification-source-recovery",
  "data/v0.8.6-medication-restore-drill-verification-batch4",
  "v0.8.6-medication-restore-drill-verification-batch4",
  "leap/e-medication-intelligence-engine",
  "integration/v0.6-master-unified",
  "ui/v0.9.2-prij-heritage-theme-and-medication-declutter"
)
$skipDirNames = @("node_modules", ".git", ".next", "dist", "build", "Windows", "Program Files", "Program Files (x86)", "ProgramData", "AppData", "playwright-report", "test-results")

function Invoke-Capture {
  param([string]$Command, [int]$MaxLines = 400)
  try {
    $output = Invoke-Expression $Command 2>&1 | Select-Object -First $MaxLines
    return @{
      command = $Command
      ok = $LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE
      output = @($output | ForEach-Object { "$_" })
    }
  } catch {
    return @{ command = $Command; ok = $false; output = @($_.Exception.Message) }
  }
}

function Test-KeywordMatch {
  param([string]$Text)
  foreach ($keyword in $keywords) {
    if ($Text -match [regex]::Escape($keyword)) { return $true }
  }
  return $false
}

function ConvertTo-SafePath {
  param([string]$Path)
  return [System.IO.Path]::GetFullPath($Path)
}

function Invoke-DockerPsql {
  param([string]$Container, [string]$Sql)
  try {
    $pgUser = (docker exec $Container printenv POSTGRES_USER 2>$null | Select-Object -First 1)
    $pgDb = (docker exec $Container printenv POSTGRES_DB 2>$null | Select-Object -First 1)
    if (-not $pgUser) { $pgUser = "postgres" }
    if (-not $pgDb) { $pgDb = "postgres" }
    $dockerSql = $Sql.Replace('"', '\"')
    $output = docker exec $Container psql -U $pgUser -d $pgDb -t -A -c $dockerSql 2>&1
    return @{
      container = $Container
      database = $pgDb
      user = $pgUser
      ok = $LASTEXITCODE -eq 0
      output = @($output | ForEach-Object { "$_" })
    }
  } catch {
    return @{
      container = $Container
      ok = $false
      output = @($_.Exception.Message)
    }
  }
}

Write-Host "V099 MEDICATION PROVENANCE RECOVERY"
Write-Host "mode=read-only"

$gitCommands = @(
  "git branch -a",
  "git tag --list",
  "git log --all --oneline --decorate --grep medication",
  "git log --all --oneline --decorate --grep drug",
  "git log --all --oneline --decorate --grep official",
  "git log --all --oneline --decorate --grep restore",
  "git log --all --oneline --decorate --grep verification",
  "git for-each-ref refs/heads refs/remotes refs/tags --format='%(refname)'"
)
$git = @()
foreach ($cmd in $gitCommands) { $git += Invoke-Capture $cmd }

$allRefsResult = Invoke-Capture "git for-each-ref refs/heads refs/remotes refs/tags --format='%(refname:short)'"
$allRefs = @($allRefsResult.output | Where-Object { $_ -and $_ -notmatch "fatal|error" })
$matchedRefs = @()
foreach ($ref in $allRefs) {
  foreach ($needle in $refNeedles) {
    if ($ref -like "*$needle*") {
      $matchedRefs += $ref
      break
    }
  }
}
$matchedRefs = @($matchedRefs | Sort-Object -Unique)

$gitFileHits = @()
foreach ($ref in $matchedRefs) {
  $tree = Invoke-Capture "git ls-tree -r --name-only $ref" 3000
  $hits = @($tree.output | Where-Object { Test-KeywordMatch $_ } | Select-Object -First 100)
  foreach ($path in $hits) {
    $probe = Invoke-Capture "git show ${ref}:$path" 80
    $contentMatches = @($probe.output | Where-Object { Test-KeywordMatch $_ } | Select-Object -First 20)
    $gitFileHits += @{
      ref = $ref
      path = $path
      contentMatchCount = $contentMatches.Count
      sampleMatches = $contentMatches
    }
  }
}

$localCandidates = @()
$localErrors = @()
$existingRoots = @($Roots | Where-Object { Test-Path $_ } | ForEach-Object { ConvertTo-SafePath $_ } | Sort-Object -Unique)
foreach ($root in $existingRoots) {
  Write-Host "checked=$root"
  try {
    Get-ChildItem -LiteralPath $root -Force -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object {
        $full = $_.FullName
        foreach ($skip in $skipDirNames) {
          if ($full -match "\\$([regex]::Escape($skip))\\") { return $false }
        }
        return Test-KeywordMatch $full
      } |
      Select-Object -First 500 |
      ForEach-Object {
        $localCandidates += @{
          path = $_.FullName
          sizeBytes = $_.Length
          modifiedTime = $_.LastWriteTimeUtc.ToString("o")
          extension = $_.Extension
        }
      }
  } catch {
    $localErrors += @{ root = $root; error = $_.Exception.Message }
  }
}

$docker = @{
  skipped = [bool]$SkipDocker
  commands = @()
  candidateNames = @()
  volumeInspections = @()
  postgresCounts = @()
}
if (-not $SkipDocker) {
  $docker.commands += Invoke-Capture "docker ps -a"
  $docker.commands += Invoke-Capture "docker volume ls"
  $docker.commands += Invoke-Capture "docker compose ps"
  $dockerText = (($docker.commands | ForEach-Object { $_.output }) -join "`n")
  $docker.candidateNames = @($dockerText -split "`n" | Where-Object { $_ -match "prij|postgres|clinic|medication" } | Select-Object -First 100)
  $volumes = @(docker volume ls --format "{{.Name}}" 2>$null | Where-Object { $_ -match "prij|postgres|clinic|medication" })
  foreach ($volume in $volumes) {
    $docker.volumeInspections += Invoke-Capture "docker volume inspect $volume" 80
  }
  $containers = @(docker ps -a --format "{{.Names}}" 2>$null | Where-Object { $_ -match "prij|postgres|clinic|medication" })
  foreach ($container in $containers) {
    $countSql = "select 'DrugMarketVariant total', count(*) from ""DrugMarketVariant"" union all select 'DrugMarketVariant official', count(*) from ""DrugMarketVariant"" where ""isDemo"" = false union all select 'verified', count(*) from ""DrugMarketVariant"" where ""isDemo"" = false and ""verificationStatus"" = 'verified' union all select 'needs_review', count(*) from ""DrugMarketVariant"" where ""isDemo"" = false and ""verificationStatus"" = 'needs_review';"
    $docker.postgresCounts += Invoke-DockerPsql $container $countSql
  }
}

$currentDb = @{
  readyCheck = Invoke-Capture "npm run medication:v097:ready-check" 120
  audit = Invoke-Capture "npm run db:v095:audit" 160
}

$report = @{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  mode = "read-only"
  git = @{
    commands = $git
    matchedRefs = $matchedRefs
    fileHits = $gitFileHits
  }
  local = @{
    roots = $existingRoots
    skippedDirectoryNames = $skipDirNames
    candidates = $localCandidates
    errors = $localErrors
  }
  docker = $docker
  currentDb = $currentDb
  conclusion = "No import is performed by this script. Use the export/import helpers only after reviewing candidate artifacts."
}

$report | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonReport -Encoding UTF8

$md = @()
$md += "# v0.9.9 Medication Provenance Recovery Report"
$md += ""
$md += "Generated: $($report.generatedAt)"
$md += ""
$md += "Mode: read-only metadata/provenance inspection. No medication rows were created, imported, verified, or deleted."
$md += ""
$md += "## Summary"
$md += ""
$md += "- Git medication-related refs found: $($matchedRefs.Count)"
$md += "- Git file hits across matched refs: $($gitFileHits.Count)"
$md += "- Local roots searched: $($existingRoots.Count)"
$md += "- Local candidate path hits: $($localCandidates.Count)"
$md += "- Docker inspection skipped: $($docker.skipped)"
$md += "- Docker candidate lines: $($docker.candidateNames.Count)"
$md += "- Docker volumes inspected: $($docker.volumeInspections.Count)"
$md += ""
$md += "## Git Refs"
$md += ""
if ($matchedRefs.Count) { $matchedRefs | ForEach-Object { $md += "- $_" } } else { $md += "No matching refs found." }
$md += ""
$md += "## Git File Hits"
$md += ""
if ($gitFileHits.Count) {
  $gitFileHits | Select-Object -First 100 | ForEach-Object {
    $hitRef = $_["ref"]
    $hitPath = $_["path"]
    $hitCount = $_["contentMatchCount"]
    $md += "- ``$hitRef`:$hitPath`` content matches: $hitCount"
  }
} else {
  $md += "No medication provenance file hits found across matching refs."
}
$md += ""
$md += "## Local Roots"
$md += ""
$existingRoots | ForEach-Object { $md += "- $_" }
$md += ""
$md += "## Local Candidate Paths"
$md += ""
if ($localCandidates.Count) {
  $localCandidates | Select-Object -First 100 | ForEach-Object { $md += "- $($_.path) ($($_.sizeBytes) bytes, $($_.modifiedTime))" }
} else {
  $md += "No local path-name candidates found."
}
$md += ""
$md += "## Docker Candidates"
$md += ""
if ($docker.candidateNames.Count) {
  $docker.candidateNames | ForEach-Object { $md += "- $_" }
} else {
  $md += "No matching Docker container/volume lines found, or Docker was unavailable."
}
$md += ""
$md += "## Docker Volume Metadata"
$md += ""
if ($docker.volumeInspections.Count) {
  foreach ($volumeInspection in $docker.volumeInspections) {
    $firstName = ($volumeInspection.output | Where-Object { $_ -match '"Name"' } | Select-Object -First 1)
    $created = ($volumeInspection.output | Where-Object { $_ -match '"CreatedAt"' } | Select-Object -First 1)
    $md += "- $firstName $created"
  }
} else {
  $md += "No matching Docker volumes were found, or Docker was unavailable."
}
$md += ""
$md += "## Current DB"
$md += ""
$md += '```'
$md += ($currentDb.readyCheck.output -join "`n")
$md += '```'
$md += ""
$md += "## Decision"
$md += ""
$md += "Review this report before using the v0.9.9 export/import helpers. If no usable old DB/export/source is present, the blocker remains an unavailable ignored local artifact."

$md -join "`n" | Set-Content -Path $mdReport -Encoding UTF8

Write-Host "matchedRefs=$($matchedRefs.Count)"
Write-Host "gitFileHits=$($gitFileHits.Count)"
Write-Host "localCandidates=$($localCandidates.Count)"
Write-Host "dockerCandidateLines=$($docker.candidateNames.Count)"
Write-Host "reports=$jsonReport $mdReport"
