param(
  [string]$ApiBaseUrl = $env:API_URL,
  [string]$Password = $env:DEMO_TEST_PASSWORD,
  [string]$OwnerLogin = $env:DEMO_ADMIN_LOGIN,
  [string]$NurseLogin = "runtime.nurse@prij.local"
)

$ErrorActionPreference = "Stop"

if (-not $ApiBaseUrl) { throw "API_URL is required. Use the isolated npm test runner." }
if (-not $Password) { throw "DEMO_TEST_PASSWORD is required. Use the isolated npm test runner." }
if (-not $OwnerLogin) { throw "DEMO_ADMIN_LOGIN is required. Use the isolated npm test runner." }

function Write-Step {
  param([string]$Message)
  Write-Host "AI-SAFETY $Message"
}

function Invoke-Json {
  param(
    [string]$Method = "GET",
    [string]$Uri,
    [object]$Headers,
    [object]$Body
  )

  $params = @{ Method = $Method; Uri = $Uri }
  if ($Headers -is [Microsoft.PowerShell.Commands.WebRequestSession]) {
    $params.WebSession = $Headers
    $csrfCookie = $Headers.Cookies.GetCookies($Uri)["csrf-token"]
    if ($csrfCookie) { $params.Headers = @{ "x-csrf-token" = $csrfCookie.Value } }
  } elseif ($Headers) {
    $params.Headers = $Headers
  }
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
    [object]$Headers,
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
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $login = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/auth/login" -WebSession $session -ContentType "application/json" -Body (@{ email = $Email; password = $Password } | ConvertTo-Json)
  if (-not $login -or $session.Cookies.Count -eq 0) { throw "Login failed to establish a session for $Email." }
  return $session
}

Assert-True "AI_FEATURES_ENABLED is not true in current shell" ($env:AI_FEATURES_ENABLED -ne "true")
Assert-True "AI_PROVIDER is not configured as an external provider in current shell" ([string]::IsNullOrWhiteSpace($env:AI_PROVIDER) -or $env:AI_PROVIDER -eq "disabled")

$owner = Login $OwnerLogin
$nurse = Login $NurseLogin

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

if (-not $env:PRIJ_TEST_DATABASE_NAME -or $env:PRIJ_TEST_DATABASE_NAME -notlike "prij_clinic_test_ai_*") {
  throw "A guarded isolated AI test database name is required for audit verification."
}
$draftGuid = [Guid]::Parse($draft.id).ToString()
$auditSql = "SELECT count(*) FROM `"AuditLog`" WHERE `"resourceId`" = '$draftGuid'::uuid AND `"action`" = 'ai_draft.rejected' AND `"metadataJson`"->>'insertedIntoClinicalRecord' = 'false'"
$auditCount = $auditSql | docker exec -i prij-clinic-postgres psql -U prij_clinic_dev -d $env:PRIJ_TEST_DATABASE_NAME -X -tA
if ($LASTEXITCODE -ne 0) { throw "AI review audit query failed." }
Assert-True "AI review audit exists" ([int]$auditCount -gt 0)
Assert-True "AI review audit confirms no clinical insertion" ([int]$auditCount -gt 0)

Write-Host "AI-SAFETY PASS"
