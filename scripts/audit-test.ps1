param(
  [string]$ApiBaseUrl = "http://localhost:3001",
  [string]$Password = $env:DEMO_TEST_PASSWORD
)

$ErrorActionPreference = "Stop"

if (-not $Password) {
  $Password = "LocalDev123!"
}

function Write-Step {
  param([string]$Message)
  Write-Host "AUDIT $Message"
}

function Invoke-Json {
  param(
    [string]$Method = "GET",
    [string]$Uri,
    [hashtable]$Headers,
    [object]$Body
  )

  $params = @{ Method = $Method; Uri = $Uri }
  if ($Headers) { $params.Headers = $Headers }
  if ($null -ne $Body) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 10)
  }

  Invoke-RestMethod @params
}

function Assert-True {
  param([string]$Label, [bool]$Condition)
  if (-not $Condition) { throw $Label }
  Write-Step "PASS $Label"
}

$login = Invoke-Json -Method Post -Uri "$ApiBaseUrl/auth/login" -Body @{
  email = "demo.owner@prij.local"
  password = $Password
}

if (-not $login.token) {
  throw "Owner login did not return a token."
}

$headers = @{ Authorization = "Bearer $($login.token)" }
$runId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$mrn = "DEMO-AUDIT-$runId"
$sentinel = "DO-NOT-LOG-RAW-DEMO-CONTENT-$runId"

Write-Step "create demo patient for audit coverage"
$patient = Invoke-Json -Method Post -Uri "$ApiBaseUrl/patients" -Headers $headers -Body @{
  medicalRecordNumber = $mrn
  firstName = "Demo"
  lastName = "Audit"
  notes = $sentinel
}

Write-Step "create demo encounter with raw body sentinel"
$encounter = Invoke-Json -Method Post -Uri "$ApiBaseUrl/encounters" -Headers $headers -Body @{
  patientId = $patient.id
  chiefComplaint = $sentinel
  historyText = $sentinel
  assessmentText = $sentinel
}

Write-Step "read audit log"
$audit = Invoke-Json -Uri "$ApiBaseUrl/audit?limit=100" -Headers $headers
$logs = @($audit.auditLogs)

Assert-True "audit endpoint returned log rows" ($logs.Count -gt 0)
Assert-True "patient.created audit exists" (@($logs | Where-Object { $_.action -eq "patient.created" -and $_.resourceId -eq $patient.id }).Count -ge 1)
Assert-True "encounter.created audit exists" (@($logs | Where-Object { $_.action -eq "encounter.created" -and $_.resourceId -eq $encounter.id }).Count -ge 1)

$serializedAudit = $logs | ConvertTo-Json -Depth 20
Assert-True "audit metadata does not expose raw sentinel clinical/demo body text" ($serializedAudit -notmatch [regex]::Escape($sentinel))

Write-Host "AUDIT PASS"
