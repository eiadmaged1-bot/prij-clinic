param(
  [switch]$Export,
  [switch]$ConfirmOfficialMedicationExport,
  [string]$ContainerName,
  [string]$Database = "prij_clinic_dev",
  [string]$User = "postgres",
  [string]$Destination = "storage/medication-provenance-recovery/official-medication-recovered.jsonl"
)

$ErrorActionPreference = "Stop"
$tables = @(
  "DrugMarketCountry",
  "DrugMarketSource",
  "DrugMarketProduct",
  "DrugMarketVariant",
  "DrugMarketAvailability",
  "DrugMarketImportJob",
  "DrugMarketImportRun",
  "DrugMarketManualReviewQueue",
  "OfficialMedicationSourceSnapshot",
  "DrugMarketMergeCandidate",
  "MedicationDataSource",
  "MedicationDataImportJob",
  "MedicationIngredient",
  "MedicationProduct"
)

function Invoke-ContainerPsql {
  param([string]$Sql)
  if (-not $ContainerName) { throw "ContainerName is required for this helper." }
  $dockerSql = $Sql.Replace('"', '\"')
  docker exec $ContainerName psql -U $User -d $Database -t -A -c $dockerSql
}

function Get-TableCount {
  param([string]$Table, [string]$Where = "")
  $sql = "select count(*) from ""$Table"" $Where;"
  try { return [int](Invoke-ContainerPsql $sql | Select-Object -First 1) } catch { return $null }
}

Write-Host "V099 EXPORT MEDICATION FROM RECOVERY DB"
Write-Host "mode=$(@{ $true = 'export'; $false = 'dry-run' }[$Export.IsPresent])"

$variantTotal = Get-TableCount "DrugMarketVariant"
$officialTotal = Get-TableCount "DrugMarketVariant" "where ""isDemo"" = false"
$verifiedTotal = Get-TableCount "DrugMarketVariant" "where ""isDemo"" = false and ""verificationStatus"" = 'verified'"
$needsReviewTotal = Get-TableCount "DrugMarketVariant" "where ""isDemo"" = false and ""verificationStatus"" = 'needs_review'"

Write-Host "DrugMarketVariant total=$variantTotal"
Write-Host "official non-demo=$officialTotal"
Write-Host "verified=$verifiedTotal"
Write-Host "needs_review=$needsReviewTotal"

if (-not $Export) {
  Write-Host "Dry run only. Add -Export -ConfirmOfficialMedicationExport after confirming this is an isolated recovery DB."
  exit 0
}

if (-not $ConfirmOfficialMedicationExport) {
  throw "Export requires -ConfirmOfficialMedicationExport."
}
if (-not $ContainerName) {
  throw "Export requires -ContainerName."
}
if (($officialTotal -as [int]) -le 0) {
  throw "No non-demo official medication variants found to export."
}

$destinationPath = [System.IO.Path]::GetFullPath($Destination)
$destinationDir = Split-Path -Parent $destinationPath
New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null

$records = New-Object System.Collections.Generic.List[string]
foreach ($table in $tables) {
  $where = ""
  if ($table -eq "DrugMarketVariant" -or $table -eq "DrugMarketProduct") { $where = " where ""isDemo"" = false" }
  $sql = "select json_build_object('type', '$table', 'data', row_to_json(t))::text from (select * from ""$table""$where order by 1) t;"
  try {
    $rows = Invoke-ContainerPsql $sql
    foreach ($row in $rows) {
      if ($row) { $records.Add($row) }
    }
  } catch {
    Write-Host "WARN skipped $table`: $($_.Exception.Message)"
  }
}

$dataText = ($records -join "`n") + "`n"
$sha = [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($dataText))).Replace("-", "").ToLowerInvariant()
$counts = @{
  DrugMarketVariant = $officialTotal
  verified = $verifiedTotal
  needs_review = $needsReviewTotal
}
$manifest = @{
  type = "manifest"
  format = "official-medication-jsonl-v1"
  restoreCompatibilityVersion = "v0.9.9-recovered-reference-export"
  exportedAt = (Get-Date).ToUniversalTime().ToString("o")
  source = @{ container = $ContainerName; database = $Database; user = $User }
  includeDemo = $false
  counts = $counts
  sha256 = $sha
  safety = @{
    excludesPatientData = $true
    excludesSecrets = $true
    marketMetadataOnly = $true
    exportedFromIsolatedRecoveryDbExpected = $true
  }
} | ConvertTo-Json -Depth 5 -Compress

Set-Content -Path $destinationPath -Value ($manifest + "`n" + $dataText) -Encoding UTF8
Write-Host "exported=$destinationPath"
Write-Host "Validate next:"
Write-Host "npm run medication:v098:validate-candidate -- --file `"$destinationPath`""
