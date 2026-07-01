param(
  [switch]$Scan,
  [switch]$DryRun,
  [switch]$Apply,
  [switch]$ConfirmApply,
  [string]$File,
  [string]$Source = "GENERIC",
  [string]$Country = "BH"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Inbox = Join-Path $RepoRoot "storage\official-medication-sources"
$SupportedParseExtensions = @(".csv", ".xlsx", ".xls", ".json", ".jsonl")
$AllowedApplyEnvs = @("local", "dev", "test", "ci")

Set-Location $RepoRoot

function Invoke-Npm {
  param([string[]]$Arguments)
  & npm @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "npm $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Get-CandidateFiles {
  if (-not (Test-Path -LiteralPath $Inbox)) {
    return @()
  }
  return @(Get-ChildItem -LiteralPath $Inbox -File | Where-Object {
    $SupportedParseExtensions -contains $_.Extension.ToLowerInvariant()
  } | Sort-Object LastWriteTime -Descending)
}

function Resolve-ImportFile {
  if ($File) {
    $resolved = Resolve-Path -LiteralPath $File -ErrorAction Stop
    $item = Get-Item -LiteralPath $resolved
    if (-not ($SupportedParseExtensions -contains $item.Extension.ToLowerInvariant())) {
      throw "Selected file extension is not parseable by v100 reimport: $($item.Extension)"
    }
    return $item.FullName
  }

  $candidates = Get-CandidateFiles
  if ($candidates.Count -ne 1) {
    throw "Import requires exactly one parseable inbox candidate or a selected -File path. Found $($candidates.Count)."
  }
  return $candidates[0].FullName
}

function Assert-ApplyAllowed {
  if (-not $ConfirmApply) {
    throw "Apply requires -ConfirmApply."
  }
  $appEnv = $env:APP_ENV
  if (-not $AllowedApplyEnvs.Contains($appEnv)) {
    throw "Apply refused for APP_ENV=$appEnv. Set APP_ENV to local, dev, test, or ci."
  }
}

Invoke-Npm @("run", "medication:v101:import-status")

if (-not $Scan -and -not $DryRun -and -not $Apply) {
  Write-Host "V101 operator defaulted to status only. Pass -Scan, -DryRun, or -Apply."
  exit 0
}

if ($Scan) {
  Invoke-Npm @("run", "medication:v100:source-list")
}

if ($DryRun) {
  $selectedFile = Resolve-ImportFile
  Invoke-Npm @("run", "medication:v100:reimport:dry-run", "--", "--source", $Source, "--country", $Country, "--file", $selectedFile)
}

if ($Apply) {
  Assert-ApplyAllowed
  $selectedFile = Resolve-ImportFile
  Invoke-Npm @("run", "medication:v100:reimport:apply", "--", "--source", $Source, "--country", $Country, "--file", $selectedFile)
  Invoke-Npm @("run", "medication:v097:ready-check:strict")
  Invoke-Npm @("run", "prescriptions:v097:medication-selection-check")
}
