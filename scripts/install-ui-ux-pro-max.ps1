[CmdletBinding()]
param(
    [ValidateSet("codex", "claude", "both")]
    [string]$Target = "both",

    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$CliVersion = "2.5.0"
$PackageSpec = "ui-ux-pro-max-cli@$CliVersion"
$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Assert-CommandAvailable {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

function Assert-PythonAvailable {
    if (Get-Command python -ErrorAction SilentlyContinue) {
        & python --version
        if ($LASTEXITCODE -eq 0) {
            return
        }
    }

    if (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3 --version
        if ($LASTEXITCODE -eq 0) {
            return
        }
    }

    throw "Python 3 is required by UI/UX Pro Max search scripts. Install Python 3, then rerun this installer."
}

function Install-UiUxSkill {
    param([Parameter(Mandatory = $true)][ValidateSet("codex", "claude")][string]$Assistant)

    $arguments = @(
        "exec",
        "--yes",
        "--package=$PackageSpec",
        "--",
        "uipro",
        "init",
        "--ai",
        $Assistant,
        "--offline"
    )

    if ($Force) {
        $arguments += "--force"
    }

    Write-Host "Installing UI/UX Pro Max $CliVersion for $Assistant..."
    & npm @arguments

    if ($LASTEXITCODE -ne 0) {
        throw "UI/UX Pro Max installation failed for $Assistant with exit code $LASTEXITCODE."
    }
}

Push-Location $RepositoryRoot
$previousIgnoreScripts = $env:npm_config_ignore_scripts

try {
    Assert-CommandAvailable -Name "node"
    Assert-CommandAvailable -Name "npm"
    Assert-PythonAvailable

    $packageJsonPath = Join-Path $RepositoryRoot "package.json"
    if (-not (Test-Path $packageJsonPath)) {
        throw "Run this script from the Prij Clinic repository. package.json was not found."
    }

    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    if ($packageJson.name -ne "prij-clinic") {
        throw "Refusing to install outside the Prij Clinic repository."
    }

    # The selected package has no required install lifecycle scripts. Disabling
    # lifecycle scripts reduces supply-chain exposure during the temporary npm exec.
    $env:npm_config_ignore_scripts = "true"

    $assistants = if ($Target -eq "both") { @("codex", "claude") } else { @($Target) }
    foreach ($assistant in $assistants) {
        Install-UiUxSkill -Assistant $assistant
    }

    $expectedFiles = @()
    if ($assistants -contains "codex") {
        $expectedFiles += ".agents/skills/ui-ux-pro-max/SKILL.md"
    }
    if ($assistants -contains "claude") {
        $expectedFiles += ".claude/skills/ui-ux-pro-max/SKILL.md"
    }

    foreach ($relativePath in $expectedFiles) {
        $absolutePath = Join-Path $RepositoryRoot $relativePath
        if (-not (Test-Path $absolutePath)) {
            throw "Installation reported success, but expected file '$relativePath' is missing."
        }
    }

    Write-Host "UI/UX Pro Max $CliVersion installed and verified for: $($assistants -join ', ')."
    Write-Host "Restart the relevant coding assistant so it discovers the new skill."
}
finally {
    if ($null -eq $previousIgnoreScripts) {
        Remove-Item Env:npm_config_ignore_scripts -ErrorAction SilentlyContinue
    }
    else {
        $env:npm_config_ignore_scripts = $previousIgnoreScripts
    }

    Pop-Location
}
