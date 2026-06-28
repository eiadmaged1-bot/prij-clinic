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
  Write-Host "AI-SAFETY $Message"
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

function Get-StatusCode {
  param(
    [string]$Method = "GET",
    [string]$Uri,
    [hashtable]$Headers,
    [object]$Body
  )

  try {
    Invoke-Json -Method $Method -Uri $Uri -Headers $Headers -Body $Body | Out-Null
    return 200
  } catch {
    if (-not $_.Exception.Response) { throw }
    return [int]$_.Exception.Response.StatusCode
  }
}

function Assert-True {
  param([string]$Label, [bool]$Condition)
  if (-not $Condition) { throw $Label }
  Write-Step "PASS $Label"
}

function Login {
  param([string]$Email)
  $login = Invoke-Json -Method Post -Uri "$ApiBaseUrl/auth/login" -Body @{ email = $Email; password = $Password }
  if (-not $login.token) { throw "Login failed for $Email." }
  return @{ Authorization = "Bearer $($login.token)" }
}

Assert-True "AI_FEATURES_ENABLED is not true in current shell" ($env:AI_FEATURES_ENABLED -ne "true")
Assert-True "AI_PROVIDER is not configured as an external provider in current shell" ([string]::IsNullOrWhiteSpace($env:AI_PROVIDER) -or $env:AI_PROVIDER -eq "disabled")

$owner = Login "demo.owner@prij.local"
$nurse = Login "demo.nurse@prij.local"

$summary = Invoke-Json -Uri "$ApiBaseUrl/dashboard/summary" -Headers $owner
Assert-True "dashboard reports AI disabled" ($summary.safety.aiEnabled -eq $false)
Assert-True "dashboard reports doctor review required" ($summary.safety.clinicalDraftsRequireDoctorReview -eq $true)

$patients = Invoke-Json -Uri "$ApiBaseUrl/patients" -Headers $owner
$patient = @($patients.patients | Where-Object { $_.medicalRecordNumber -eq "DEMO-MRN-001" } | Select-Object -First 1)
if (-not $patient -or -not $patient.id) {
  $patient = Invoke-Json -Method Post -Uri "$ApiBaseUrl/patients" -Headers $owner -Body @{
    medicalRecordNumber = "DEMO-AI-SAFETY-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
    firstName = "Demo"
    lastName = "AISafety"
    notes = "Fake local demo patient for AI safety test only."
  }
  Write-Step "WARN seed demo patient was unavailable; created fake local AI safety patient"
}
Assert-True "demo patient is available for AI safety test" ($null -ne $patient -and $null -ne $patient.id)

$draft = Invoke-Json -Method Post -Uri "$ApiBaseUrl/ai-drafts" -Headers $owner -Body @{
  draftType = "encounter_summary"
  patientId = $patient.id
  inputSourceSummary = "Local demo AI safety test only. No external AI request."
}

Assert-True "AI draft model provider is disabled_mock" ($draft.modelProvider -eq "disabled_mock")
Assert-True "AI draft model name is no_external_ai" ($draft.modelName -eq "no_external_ai")
Assert-True "AI draft placeholder states external AI is disabled" ($draft.generatedText -match "External AI access is disabled")

$drafts = Invoke-Json -Uri "$ApiBaseUrl/ai-drafts" -Headers $owner
Assert-True "listed AI drafts remain disabled/mock" (@($drafts.aiDrafts | Where-Object { $_.modelProvider -ne "disabled_mock" -or $_.modelName -ne "no_external_ai" }).Count -eq 0)

$nurseReviewStatus = Get-StatusCode -Method Patch -Uri "$ApiBaseUrl/ai-drafts/$($draft.id)/review" -Headers $nurse -Body @{
  status = "approved"
  reviewNote = "Demo denied review attempt."
}
Assert-True "AI draft review requires permission" ($nurseReviewStatus -eq 403)

$signStatus = Get-StatusCode -Method Post -Uri "$ApiBaseUrl/ai-drafts/$($draft.id)/sign" -Headers $owner
Assert-True "AI draft route cannot sign records" ($signStatus -eq 404)

$insertStatus = Get-StatusCode -Method Post -Uri "$ApiBaseUrl/ai-drafts/$($draft.id)/insert-approved" -Headers $owner
Assert-True "AI draft route cannot insert into final clinical records" ($insertStatus -eq 404)

$reviewed = Invoke-Json -Method Patch -Uri "$ApiBaseUrl/ai-drafts/$($draft.id)/review" -Headers $owner -Body @{
  status = "rejected"
  reviewNote = "Demo safety test rejection."
}
Assert-True "allowed review updates only AI draft artifact" ($reviewed.status -eq "rejected")

$audit = Invoke-Json -Uri "$ApiBaseUrl/audit?limit=100" -Headers $owner
$reviewAudit = @($audit.auditLogs | Where-Object { $_.resourceId -eq $draft.id -and $_.action -eq "ai_draft.rejected" } | Select-Object -First 1)
Assert-True "AI review audit exists" ($null -ne $reviewAudit)
Assert-True "AI review audit confirms no clinical insertion" ($reviewAudit.metadataJson.insertedIntoClinicalRecord -eq $false)

Write-Host "AI-SAFETY PASS"
