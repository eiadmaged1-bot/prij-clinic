$ErrorActionPreference = "Stop"

function Run-Step {
  param([string]$Command)
  Write-Host ""
  Write-Host "==> $Command"
  Invoke-Expression $Command
}

Run-Step "npm run dev:diagnose"
Run-Step "npm run prisma:repair"
Run-Step "npm run prisma:migrate:deploy"
Run-Step "npm run prisma:seed"
Run-Step "npm run db:v095:clean:dry-run"
$env:APP_ENV = "local"
Run-Step "npm run db:v095:clean:apply"
Run-Step "npm run db:v096:ready-check"
Run-Step "npm run medication:v097:find-sources"
Run-Step "npm run medication:v097:restore:dry-run"
Run-Step "npm run medication:v097:ready-check"
Run-Step "npm run guidelines:v097:ready-check"
Run-Step "npm run accounts:v097:role-ready-check"

$variantCount = node -e 'const {PrismaClient}=require("@prisma/client"); const p=new PrismaClient(); p.drugMarketVariant.count({where:{isDemo:false,verificationStatus:{in:["verified","needs_review"]}}}).then(c=>{console.log(c); return p.$disconnect();}).catch(e=>{console.error(e.message); process.exit(1);})'
if ([int]$variantCount -gt 0) {
  Run-Step "npm run prescriptions:v097:medication-selection-check"
} else {
  Write-Host "WARN skipping prescription medication selection check because no official medication rows are available."
}

Write-Host ""
Write-Host "V097 reference DB preparation complete. Medication restore apply is intentionally manual:"
Write-Host '  $env:APP_ENV="local"; npm run medication:v097:restore:apply'
