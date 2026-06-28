param(
  [string]$ApiBaseUrl = "http://localhost:3001",
  [string]$Password = $env:DEMO_TEST_PASSWORD
)

$ErrorActionPreference = "Stop"
$WarningCount = 0

if (-not $Password) {
  $Password = "LocalDev123!"
}

function Write-Step {
  param([string]$Message)
  Write-Host "SCOPE $Message"
}

function Write-Warn {
  param([string]$Message)
  $script:WarningCount += 1
  Write-Host "SCOPE WARN $Message"
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

function Login {
  param([string]$Email)
  $login = Invoke-Json -Method Post -Uri "$ApiBaseUrl/auth/login" -Body @{ email = $Email; password = $Password }
  if (-not $login.token) { throw "Login failed for $Email." }
  return @{ Authorization = "Bearer $($login.token)" }
}

function Assert-True {
  param([string]$Label, [bool]$Condition)
  if (-not $Condition) { throw $Label }
  Write-Step "PASS $Label"
}

$owner = Login "demo.owner@prij.local"
$doctor = Login "demo.doctor@prij.local"
$nurse = Login "demo.nurse@prij.local"

$ownerPatients = Invoke-Json -Uri "$ApiBaseUrl/patients" -Headers $owner
$nursePatients = Invoke-Json -Uri "$ApiBaseUrl/patients" -Headers $nurse

$ownerPatientList = @($ownerPatients.patients)
$nursePatientList = @($nursePatients.patients)

$patientA = $ownerPatientList | Where-Object { $_.medicalRecordNumber -eq "DEMO-MRN-001" } | Select-Object -First 1
$patientB = $ownerPatientList | Where-Object { $_.medicalRecordNumber -eq "DEMO-MRN-002" } | Select-Object -First 1

Assert-True "owner can see Demo Patient A fixture" ($null -ne $patientA)
Assert-True "owner can see Demo Patient B fixture" ($null -ne $patientB)
Assert-True "scope fixtures are in different branches" ($patientA.branchId -ne $patientB.branchId)
Assert-True "nurse branch scope includes Demo Patient B" (@($nursePatientList | Where-Object { $_.medicalRecordNumber -eq "DEMO-MRN-002" }).Count -ge 1)
Assert-True "nurse branch scope excludes Demo Patient A" (@($nursePatientList | Where-Object { $_.medicalRecordNumber -eq "DEMO-MRN-001" }).Count -eq 0)

$patientAStatusForNurse = Get-StatusCode -Uri "$ApiBaseUrl/patients/$($patientA.id)" -Headers $nurse
Assert-True "nurse cannot read out-of-branch patient detail" ($patientAStatusForNurse -eq 404)

$ownerAppointments = Invoke-Json -Uri "$ApiBaseUrl/appointments" -Headers $owner
$doctorAppointments = Invoke-Json -Uri "$ApiBaseUrl/appointments" -Headers $doctor
if (@($ownerAppointments.appointments).Count -gt 0) {
  Assert-True "doctor appointment scope does not exceed owner-visible appointment count" (@($doctorAppointments.appointments).Count -le @($ownerAppointments.appointments).Count)
} else {
  Write-Warn "No owner-visible appointments were available for doctor-scope count comparison."
}

Write-Warn "Create/update referenced-record scope validation is still documented as a known MVP limitation."
Write-Warn "Patient-to-doctor assignment is not modeled, so patient reads are branch-scoped rather than assigned-doctor scoped."

Write-Host "SCOPE PASS with $WarningCount warning(s)"
