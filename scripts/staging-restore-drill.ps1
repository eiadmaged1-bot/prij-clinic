param(
  [string]$EnvFile = ".env.staging",
  [string]$ComposeProject = "prij-clinic-staging",
  [string]$BackupFile,
  [string]$ConfirmRestore
)

$ErrorActionPreference = "Stop"

if ($env:CI -eq "true") {
  throw "Refusing to run the staging restore drill in CI."
}

if ($ConfirmRestore -ne "STAGING_RESTORE_DRILL") {
  throw "Restore drill is guarded. Re-run with -ConfirmRestore STAGING_RESTORE_DRILL after confirming this is staging."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $EnvFile))

if (-not (Test-Path -LiteralPath $envPath)) {
  throw "Staging env file was not found."
}

function Read-EnvFileValue {
  param([string]$Path, [string]$Name)

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $separator = $trimmed.IndexOf("=")
    if ($separator -lt 0) {
      continue
    }

    if ($trimmed.Substring(0, $separator).Trim() -eq $Name) {
      return $trimmed.Substring($separator + 1).Trim().Trim('"').Trim("'")
    }
  }

  return $null
}

function Invoke-ScalarQuery {
  param([string]$Database, [string]$Query, [string]$Label)

  $output = $Query |
    docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres psql -v ON_ERROR_STOP=1 -At -U $dbUser -d $Database
  if ($LASTEXITCODE -ne 0) {
    throw "$Label query failed."
  }

  $value = ($output | Out-String).Trim()
  if (-not $value) {
    throw "$Label query returned no value."
  }

  return $value
}

$appEnv = Read-EnvFileValue -Path $envPath -Name "APP_ENV"
$dbName = Read-EnvFileValue -Path $envPath -Name "POSTGRES_DB"
$dbUser = Read-EnvFileValue -Path $envPath -Name "POSTGRES_USER"

if ($appEnv -ne "staging") {
  throw "Refusing restore drill because APP_ENV is not staging."
}

if ($ComposeProject -notmatch '^prij-clinic-staging(?:-[a-z0-9-]+)?$') {
  throw "ComposeProject must be explicitly staging-scoped."
}

if ($dbName -notmatch '^[A-Za-z0-9_]+$' -or $dbUser -notmatch '^[A-Za-z0-9_]+$') {
  throw "POSTGRES_DB and POSTGRES_USER must use safe identifier characters."
}

$drillDb = "${dbName}_restore_drill"
if ($drillDb -eq $dbName -or -not $drillDb.EndsWith("_restore_drill")) {
  throw "Disposable restore database name is unsafe."
}

$allowedBackupRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot "backups\staging"))
$allowedBackupPrefix = $allowedBackupRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

if ($BackupFile) {
  $resolvedBackup = (Resolve-Path -LiteralPath $BackupFile -ErrorAction Stop).Path
} else {
  $latestBackup = Get-ChildItem -LiteralPath (Join-Path $repoRoot "backups\staging") -File -Filter "*.sql" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $latestBackup) {
    throw "No staging SQL backup was found. Run npm run backup:staging first."
  }
  $resolvedBackup = $latestBackup.FullName
}

$resolvedBackup = [System.IO.Path]::GetFullPath($resolvedBackup)
if (-not $resolvedBackup.StartsWith($allowedBackupPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "BackupFile must be a canonical backup inside backups/staging."
}
if ([System.IO.Path]::GetFileName($resolvedBackup) -notmatch '^prij-clinic-staging-\d{8}-\d{6}\.sql$') {
  throw "BackupFile does not use the canonical staging backup filename."
}

$hashPath = "$resolvedBackup.sha256"
if (-not (Test-Path -LiteralPath $hashPath)) {
  throw "Backup integrity file is missing. Create the backup with npm run backup:staging."
}
$expectedHash = (Get-Content -LiteralPath $hashPath -Raw).Trim().ToLowerInvariant()
$actualHash = (Get-FileHash -LiteralPath $resolvedBackup -Algorithm SHA256).Hash.ToLowerInvariant()
if ($expectedHash -notmatch '^[a-f0-9]{64}$' -or $actualHash -ne $expectedHash) {
  throw "Backup SHA-256 integrity verification failed."
}

$unsafeBackupPattern = '(?im)^\s*\\(?:connect|c|!|copy)\b|\b(?:CREATE|DROP|ALTER)\s+DATABASE\b|\bCOPY\b[^;]*\bPROGRAM\b|\bCREATE\s+EXTENSION\b'
if (Select-String -LiteralPath $resolvedBackup -Pattern $unsafeBackupPattern -Quiet) {
  throw "Backup contains commands that are unsafe for an isolated restore drill."
}

$env:STAGING_ENV_FILE = $envPath

Write-Host "Starting guarded staging restore drill."
Write-Host "Source database will remain unchanged."
Write-Host "Disposable database: $drillDb"

docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml up -d postgres | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw "Failed to start staging PostgreSQL."
}

$terminateSql = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$drillDb' AND pid <> pg_backend_pid();"

try {
  docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres psql -v ON_ERROR_STOP=1 -U $dbUser -d postgres -c $terminateSql | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to terminate disposable restore database connections."
  }

  docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres dropdb --if-exists -U $dbUser $drillDb
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to remove the previous disposable restore database."
  }

  docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres createdb -U $dbUser $drillDb
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to create the disposable restore database."
  }

  Get-Content -LiteralPath $resolvedBackup -Raw |
    docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres psql -X --quiet -v ON_ERROR_STOP=1 -U $dbUser -d $drillDb | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Restore into the disposable database failed."
  }

  $migrationQuery = 'SELECT COUNT(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;'
  $tableQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
  $coreDataQuery = 'SELECT json_build_object(''users'', (SELECT COUNT(*) FROM "User"), ''patients'', (SELECT COUNT(*) FROM "Patient"), ''branches'', (SELECT COUNT(*) FROM "Branch"), ''auditLogs'', (SELECT COUNT(*) FROM "AuditLog"))::text;'

  $sourceMigrations = Invoke-ScalarQuery -Database $dbName -Query $migrationQuery -Label "Source migration count"
  $restoredMigrations = Invoke-ScalarQuery -Database $drillDb -Query $migrationQuery -Label "Restored migration count"
  $sourceTables = Invoke-ScalarQuery -Database $dbName -Query $tableQuery -Label "Source table count"
  $restoredTables = Invoke-ScalarQuery -Database $drillDb -Query $tableQuery -Label "Restored table count"
  $sourceCoreData = Invoke-ScalarQuery -Database $dbName -Query $coreDataQuery -Label "Source core row count"
  $restoredCoreData = Invoke-ScalarQuery -Database $drillDb -Query $coreDataQuery -Label "Restored core row count"

  if ($sourceMigrations -ne $restoredMigrations) {
    throw "Migration-count verification failed."
  }

  if ($sourceTables -ne $restoredTables) {
    throw "Table-count verification failed."
  }

  if ($sourceCoreData -ne $restoredCoreData) {
    throw "Core row-count verification failed."
  }

} finally {
  docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres psql -v ON_ERROR_STOP=1 -U $dbUser -d postgres -c $terminateSql | Out-Host
  $terminateExitCode = $LASTEXITCODE
  docker compose --env-file $envPath -p $ComposeProject -f docker-compose.staging.yml exec -T postgres dropdb --if-exists -U $dbUser $drillDb
  $dropExitCode = $LASTEXITCODE
  if ($terminateExitCode -ne 0 -or $dropExitCode -ne 0) {
    throw "Disposable restore database cleanup failed. The drill is not complete and needs operator review."
  } else {
    Write-Host "Disposable restore database removed. Source staging database was not changed."
  }
}

Write-Host "PASS staging restore drill"
Write-Host "Verified migration count: $restoredMigrations"
Write-Host "Verified public table count: $restoredTables"
Write-Host "Verified core row counts: $restoredCoreData"
