$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$handoffDir = Join-Path $root "ai-graphic-handoff"
$storageDir = Join-Path $root "storage\ui-export"
$stageDir = Join-Path $storageDir "prij-clinic-ai-graphic-handoff-v0.10.11"
$zipPath = Join-Path $storageDir "prij-clinic-ai-graphic-handoff-v0.10.11.zip"

function Fail($message) {
  Write-Error $message
  exit 1
}

if (!(Test-Path $handoffDir)) {
  Fail "Missing handoff source folder: $handoffDir"
}

if (!(Test-Path (Join-Path $root "ui-export\index.html"))) {
  Write-Host "ui-export is missing; rebuilding v0.10.4 static HTML lab..."
  npm run design:export-html
}

$required = @(
  "README.md",
  "AI_REDESIGN_BRIEF.md",
  "DESIGN_RULES.md",
  "THEME_TOKENS.md",
  "SCREEN_LIST.md",
  "DO_NOT_CHANGE.md",
  "html\index.html",
  "css\handoff.css",
  "js\handoff.js",
  "single-file\prij-dashboard.html",
  "single-file\prij-patient-file.html",
  "single-file\prij-doctor-workspace.html",
  "single-file\prij-admin.html",
  "single-file\prij-mobile-shell.html"
)

foreach ($relative in $required) {
  $path = Join-Path $handoffDir $relative
  if (!(Test-Path $path)) {
    Fail "Required handoff file missing: $relative"
  }
}

New-Item -ItemType Directory -Force -Path $storageDir | Out-Null
Remove-Item -Recurse -Force $stageDir -ErrorAction SilentlyContinue
Remove-Item -Force $zipPath -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $stageDir | Out-Null

Copy-Item -Recurse -Force (Join-Path $handoffDir "*") $stageDir

$forbiddenPaths = @(
  ".env",
  "uploads",
  "storage",
  "logs",
  "backups",
  "playwright-report",
  "test-results"
)

$stagedFiles = Get-ChildItem -Path $stageDir -Recurse -File
foreach ($file in $stagedFiles) {
  $relative = $file.FullName.Substring($stageDir.Length + 1)
  foreach ($blockedPath in $forbiddenPaths) {
    if ($relative -match "(^|[\\/])$([regex]::Escape($blockedPath))($|[\\/])") {
      Fail "Forbidden path copied into handoff package: $relative"
    }
  }
}

$secretPatterns = @(
  "sk-[A-Za-z0-9_-]{20,}",
  "OPENAI_API_KEY\s*=",
  "DATABASE_URL\s*=",
  "JWT_SECRET\s*=",
  "password\s*[:=]\s*['""][^'""]+['""]",
  "BEGIN (RSA|OPENSSH|PRIVATE) KEY"
)

$forbiddenText = @(
  "production-ready medical software",
  "AI diagnosis enabled",
  "AI prescribing enabled",
  "automatic dosing",
  "autonomous prescribing"
)

foreach ($file in $stagedFiles) {
  $content = Get-Content -Raw -LiteralPath $file.FullName
  foreach ($pattern in $secretPatterns) {
    if ($content -match $pattern) {
      Fail "Secret-like pattern found in $($file.FullName): $pattern"
    }
  }
  foreach ($term in $forbiddenText) {
    if ($content.ToLowerInvariant().Contains($term.ToLowerInvariant())) {
      Fail "Forbidden text found in $($file.FullName): $term"
    }
  }
}

Compress-Archive -Path (Join-Path $stageDir "*") -DestinationPath $zipPath -Force
Remove-Item -Recurse -Force $stageDir

Write-Host "AI graphic handoff package generated:"
Write-Host $zipPath
