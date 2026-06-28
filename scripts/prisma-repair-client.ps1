$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$clientDir = Join-Path $repoRoot "node_modules\.prisma\client"
$requiredFiles = @(
  (Join-Path $clientDir "default.js"),
  (Join-Path $clientDir "query_engine-windows.dll.node")
)
$tempImportTest = Join-Path $repoRoot ".prisma-import-test.$PID.cjs"

function Invoke-RepoCommand {
  param([string[]]$Command)

  Push-Location $repoRoot
  try {
    & $Command[0] @($Command | Select-Object -Skip 1)
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed: $($Command -join ' ')"
    }
  } finally {
    Pop-Location
  }
}

Invoke-RepoCommand @("npm", "run", "dev:stop")

if (Test-Path -LiteralPath $clientDir) {
  Remove-Item -LiteralPath $clientDir -Recurse -Force
}

Invoke-RepoCommand @("npm", "run", "prisma:generate")

foreach ($file in $requiredFiles) {
  if (-not (Test-Path -LiteralPath $file)) {
    throw "Required Prisma Client file is missing: $file"
  }
}

$importTest = @'
const { PrismaClient } = require("@prisma/client");

if (typeof PrismaClient !== "function") {
  throw new Error("PrismaClient export is not a constructor.");
}

const prisma = new PrismaClient();
Promise.resolve()
  .then(() => prisma.$disconnect())
  .then(() => {
    console.log("Prisma import ok");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
'@

try {
  Set-Content -LiteralPath $tempImportTest -Value $importTest -Encoding ASCII

  Push-Location $repoRoot
  try {
    node $tempImportTest
    if ($LASTEXITCODE -ne 0) {
      throw "Prisma import test failed."
    }
  } finally {
    Pop-Location
  }
} finally {
  Remove-Item -LiteralPath $tempImportTest -Force -ErrorAction SilentlyContinue
}
