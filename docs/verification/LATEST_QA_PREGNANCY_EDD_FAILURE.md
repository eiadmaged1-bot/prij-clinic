# Latest QA Pregnancy and EDD Failure

- Run ID: 30176841313
- Stage: verification report and commit
- Error: Staged QA implementation has diff-check errors.
- Database migration/seed/reset/delete/truncate: NOT RUN
- Production data modified: NO

## Diagnostic tails

### build.stderr.log
```text
 âš  Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\package-lock.json as the root directory.
 To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats for more information.
 Detected additional lockfiles: 
   * C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\package-lock.json

<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|javascript/auto|C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\node_modules\next\dist\build\webpack\loaders\next-flight-css-loader.js??ruleSet[1].rules[14].oneOf[5].use[0]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[1]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\apps\web\components\investigations\investigation-station-v3.module.css|ssr': No serializer registered for Warning
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
 âš  Compiled with warnings in 17.9s

./components/investigations/investigation-station-v3.module.css
Warning

(177:65) autoprefixer: start value has mixed support, consider using flex-start instead

Import trace for requested module:
./components/investigations/investigation-station-v3.module.css
./components/investigations/InvestigationStationV3.tsx

./components/investigations/investigation-station-v3.module.css
Warning

(203:61) autoprefixer: start value has mixed support, consider using flex-start instead

Import trace for requested module:
./components/investigations/investigation-station-v3.module.css
./components/investigations/InvestigationStationV3.tsx

<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[3]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\apps\web\app\globals.css': No serializer registered for Warning
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[3]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace\apps\web\components\investigations\investigation-station-v3.module.css': No serializer registered for Warning
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
 âš  Compiled with warnings in 5.8s

./components/investigations/investigation-station-v3.module.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[3]!./components/investigations/investigation-station-v3.module.css
Warning

(177:65) autoprefixer: start value has mixed support, consider using flex-start instead

Import trace for requested module:
./components/investigations/investigation-station-v3.module.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[3]!./components/investigations/investigation-station-v3.module.css
./components/investigations/investigation-station-v3.module.css
./components/investigations/InvestigationStationV3.tsx

./components/investigations/investigation-station-v3.module.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[3]!./components/investigations/investigation-station-v3.module.css
Warning

(203:61) autoprefixer: start value has mixed support, consider using flex-start instead

Import trace for requested module:
./components/investigations/investigation-station-v3.module.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[3]!./components/investigations/investigation-station-v3.module.css
./components/investigations/investigation-station-v3.module.css
./components/investigations/InvestigationStationV3.tsx

./app/globals.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[3]!./app/globals.css
Warning

(6760:41) autoprefixer: end value has mixed support, consider using flex-end instead

Import trace for requested module:
./app/globals.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[3]!./app/globals.css
./app/globals.css

./app/globals.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[3]!./app/globals.css
Warning

(6813:61) autoprefixer: end value has mixed support, consider using flex-end instead

Import trace for requested module:
./app/globals.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[3]!./app/globals.css
./app/globals.css

```

### build.stdout.log
```text
â”œ â—‹ /admin/drug-market/automation                    176 B         142 kB
â”œ â—‹ /admin/drug-market/coverage                      176 B         142 kB
â”œ Æ’ /admin/drug-market/import                      3.27 kB         134 kB
â”œ â—‹ /admin/drug-market/review-queue                  177 B         142 kB
â”œ â—‹ /admin/investigations                          4.45 kB         136 kB
â”œ â—‹ /admin/medication-safety-profiles              4.55 kB         136 kB
â”œ â—‹ /admin/medications                               177 B         142 kB
â”œ â—‹ /admin/protocol-atlas                          3.88 kB         135 kB
â”œ â—‹ /admin/security-readiness                      2.41 kB         134 kB
â”œ â—‹ /admin/services                                 2.9 kB         134 kB
â”œ â—‹ /admin/settings                                 1.8 kB         133 kB
â”œ â—‹ /ai-assistant                                  3.44 kB         135 kB
â”œ â—‹ /ai-drafts                                     1.38 kB         132 kB
â”œ Æ’ /api/backend/[...path]                           148 B         103 kB
â”œ Æ’ /api/patient-import/hash                         148 B         103 kB
â”œ Æ’ /api/pdfjs/[...file]                             148 B         103 kB
â”œ Æ’ /api/pdfjs/[asset]                               148 B         103 kB
â”œ â—‹ /appointments                                    170 B         136 kB
â”œ â—‹ /billing                                         170 B         136 kB
â”œ â—‹ /calculators                                   3.29 kB         134 kB
â”œ â—‹ /calendar                                        171 B         136 kB
â”œ â—‹ /care-assist                                     178 B         131 kB
â”œ â—‹ /clinic-day/walkthrough                          186 B         131 kB
â”œ Æ’ /clinical-requests/[id]/print                  2.44 kB         105 kB
â”œ â—‹ /clinical-tags                                  4.3 kB         135 kB
â”œ â—‹ /consents                                        181 B         131 kB
â”œ â—‹ /dashboard                                     3.29 kB         134 kB
â”œ â—‹ /dermatology                                   3.93 kB         135 kB
â”œ â—‹ /doctor                                        3.23 kB         170 kB
â”œ â—‹ /doctor/case-library                           3.73 kB         135 kB
â”œ â—‹ /doctor/visit                                  2.13 kB         133 kB
â”œ â—‹ /doctor/waiting                                  144 B         174 kB
â”œ â—‹ /documents                                       144 B         174 kB
â”œ â—‹ /drug-market                                     176 B         142 kB
â”œ Æ’ /drug-market/products/[id]                       802 B         142 kB
â”œ â—‹ /drug-market/search                              177 B         142 kB
â”œ â—‹ /encounters                                    1.55 kB         133 kB
â”œ â—‹ /external-intake                               4.59 kB         139 kB
â”œ â—‹ /finance                                         170 B         136 kB
â”œ â—‹ /guidelines                                      133 B         137 kB
â”œ Æ’ /guidelines/[id]                               6.97 kB         138 kB
â”œ â—‹ /guidelines/ask                                  134 B         138 kB
â”œ â—‹ /guidelines/imports                              135 B         138 kB
â”œ â—‹ /guidelines/private-vault                        134 B         138 kB
â”œ â—‹ /guidelines/review                               134 B         138 kB
â”œ â—‹ /guidelines/search                               133 B         137 kB
â”œ â—‹ /guidelines/sources                              134 B         138 kB
â”œ â—‹ /guidelines/updates                              134 B         138 kB
â”œ â—‹ /guidelines/upload                               134 B         138 kB
â”œ â—‹ /inbox                                         1.45 kB         133 kB
â”œ â—‹ /investigations                                  175 B         143 kB
â”œ â—‹ /investigations/manage                         2.82 kB         134 kB
â”œ â—‹ /login                                         3.51 kB         121 kB
â”œ â—‹ /medications                                   1.09 kB         143 kB
â”œ â—‹ /medications/families                            177 B         142 kB
â”œ â—‹ /medications/herbals                             177 B         142 kB
â”œ â—‹ /medications/safety                              175 B         142 kB
â”œ â—‹ /medications/search                              148 B         103 kB
â”œ â—‹ /ob-ultrasounds                                  170 B         134 kB
â”œ â—‹ /orders                                          180 B         131 kB
â”œ â—‹ /owner-control                                   169 B         134 kB
â”œ Æ’ /owner/diagnostics                               148 B         103 kB
â”œ â—‹ /patients                                      3.81 kB         135 kB
â”œ Æ’ /patients/[id]                                 46.1 kB         224 kB
â”œ Æ’ /patients/[id]/print/packet                    1.84 kB         105 kB
â”œ Æ’ /patients/[id]/ultrasounds/[scanId]            6.76 kB         138 kB
â”œ Æ’ /patients/[id]/visits/[visitId]/[[...module]]    186 B         167 kB
â”œ Æ’ /patients/[id]/workspace-editor                7.08 kB         138 kB
â”œ â—‹ /patients/import                               4.32 kB         135 kB
â”œ â—‹ /patients/new                                  7.01 kB         142 kB
â”œ â—‹ /pregnancies                                     181 B         131 kB
â”œ â—‹ /pregnancy                                       181 B         131 kB
â”œ â—‹ /prescriptions                                 6.44 kB         138 kB
â”œ Æ’ /prescriptions/[id]/print                      2.76 kB         106 kB
â”œ â—‹ /protocol-atlas                                3.17 kB         134 kB
â”œ Æ’ /protocol-atlas/[id]                           3.11 kB         134 kB
â”œ â—‹ /queue                                           144 B         174 kB
â”œ â—‹ /reception                                     1.71 kB         136 kB
â”œ â—‹ /reception/check-in                            3.48 kB         138 kB
â”œ â—‹ /reception/qr-scan                             5.24 kB         140 kB
â”œ â—‹ /reception/today                                 148 B         103 kB
â”œ â—‹ /referrals                                       181 B         131 kB
â”œ Æ’ /referrals/[id]/print                          1.74 kB         105 kB
â”œ â—‹ /reports                                         144 B         174 kB
â”œ â—‹ /staff-chat                                    1.83 kB         133 kB
â”œ â—‹ /tasks                                           181 B         131 kB
â”” â—‹ /ultrasound                                      170 B         134 kB
+ First Load JS shared by all                       103 kB
  â”œ chunks/18-a6801e2fc629b9f0.js                  46.3 kB
  â”œ chunks/87c73c54-24122e7b92478d00.js            54.2 kB
  â”” other shared chunks (total)                    2.28 kB


â—‹  (Static)   prerendered as static content
Æ’  (Dynamic)  server-rendered on demand


> @prij-clinic/shared@0.1.0 build
> tsc --noEmit -p tsconfig.json

```

### clinical-workflow.stderr.log
```text
```

### clinical-workflow.stdout.log
```text
Clinical workflow unification and medication-count guard PASS
```

### feature46.stderr.log
```text
```

### feature46.stdout.log
```text
Feature 46 refractory complaint focused checks passed (no database used).
```

### fix3-medication.stderr.log
```text
```

### fix3-medication.stdout.log
```text
{"status":"PASS","rows":25094,"products":18069,"variants":22755,"reviewRecords":13818,"protectedCounts":{"safetyProfiles":35,"prescriptions":195,"prescriptionItems":195,"templates":4,"patientMedications":0,"allergies":0}}
```

### fix3-search.stderr.log
```text
```

### fix3-search.stdout.log
```text
{"status":"PASS","timings":{"Panadol":209,"Paracetamol":56,"Pa":111,"Glucophage":129,"Metformin":51,"Augmentin":136,"Amoxicillin":50,"Ø£ÙˆØ¬Ù…ÙŠÙ†ØªÙŠÙ†":141,"Ø¬Ù„ÙˆÙƒÙˆÙØ§Ø¬ÙŠ":119}}
```

### implementation.prompt.txt
```text
Inspect the real Prij Clinic codebase before editing. Implement only QA-PREG-001 and QA-EDD-001 on the checked-out work/sprint1-qa-repair-batch branch.

Locked files that MUST NOT be edited:
- scripts/qa-pregnancy-edd-contract-test.mjs
- docs/verification/QA_PREGNANCY_EDD_IMPLEMENTATION_SPEC.md

Required implementation:
1. Create packages/shared/src/pregnancy-dating.ts and export it through packages/shared/src/index.ts.
2. Implement calculateEddCandidate, confirmEddCandidate, and isPregnancyMenstrualUiSuppressed exactly as required by the locked contract.
3. Use ISO date-only UTC arithmetic: LMP +280 days; known conception +266 days; day-5 embryo transfer +261 days; day-3 transfer +263 days; ultrasound from explicit scan EDD or scan date plus the remaining days to 280 from explicit gestational weeks and days. Never infer dates from free text.
4. Calculations are candidate previews only. Never silently overwrite a confirmed EDD. A different confirmed EDD requires explicit replacement and a correction reason. Preserve mode, source, source date, confirmation date, clinician, correction reason, previous EDD, and datingHistory.
5. In ActiveVisitWorkspace, suppress ordinary current-cycle menstrual fields and ordinary menstrual abnormality flags during active pregnancy. Preserve and clearly display a read-only Pre-pregnancy menstrual baseline. Add pregnancyBleedingStatus and pregnancyBleedingOnsetDate fields.
6. Add manual and calculated EDD modes with source-specific structured fields for LMP, ultrasound, IVF embryo transfer, and known conception. Render a Calculation preview stating clinician confirmation required. Add Confirm authoritative EDD. Replacing a different confirmed EDD requires an explicit replacement choice and correction reason.
7. Keep signed encounter snapshots immutable and use existing encounter JSON persistence. No migration.
8. Update Patient Overview only as needed so active pregnancy is not displayed as ordinary active menstruation while historical menstrual timeline data remains available.
9. Do not implement ultrasound redating thresholds, diagnosis, treatment advice, calendar compaction, medication redesign, or prescription redesign in this package.
10. Keep UI compact and use narrowly scoped styling only when needed.

Safety rules:
- No migration, seed, database reset, delete, truncate, production-data access, reference-data edits, secrets, PHI, or external network calls.
- Do not weaken, delete, bypass, or modify the locked contract.
- Do not stage, commit, push, reset, clean, stash, or switch branches.
- Keep implementation changes limited to apps/web and packages/shared.
- Preserve Feature 46 and signed historical records.

Inspect before editing, implement fully, and finish with a concise changed-file summary. The outer controller runs every test and handles repairs.
```

### implementation.stderr.log
```text
    <div className="form-grid reproductive-fields">
      {!suppressMenstrualUi && context !== "postpartum" && context !== "hysterectomy" ? <label>LMP<input type="date" value={dateOnly(current.lmp)} onChange={(event) => update({ lmp: event.target.value, changeStatus: "changed" })} /></label> : null}
      {suppressMenstrualUi ? <>
        <div className="wide notice"><strong>Pre-pregnancy menstrual baseline</strong><p className="muted">Historical baseline preserved as read-only during active pregnancy: {baselineSummary(preservedBaseline)}</p></div>
        <label>Pregnancy bleeding status<select name="pregnancyBleedingStatus" value={current.pregnancyBleedingStatus ?? ""} onChange={(event) => update({ pregnancyBleedingStatus: event.target.value, changeStatus: "changed" })}><option value="">Not recorded</option><option value="none_reported">None reported</option><option value="current">Current</option><option value="resolved">Resolved</option><option value="unknown">Unknown</option></select></label>
        <label>Pregnancy bleeding onset date<input name="pregnancyBleedingOnsetDate" type="date" value={current.pregnancyBleedingOnsetDate ?? ""} onChange={(event) => update({ pregnancyBleedingOnsetDate: event.target.value, changeStatus: "changed" })} /></label>
        <PregnancyDatingEditor current={current} pregnancyEpisode={pregnancyEpisode} pregnancyLmp={pregnancyLmp} pregnancyEdd={pregnancyEdd} update={update} />
      </> : null}
      {["gynecology", "infertility", "general"].includes(context) ? <>
        <label>Regularity<select value={current.regularity ?? ""} onChange={(event) => update({ regularity: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>regular</option><option>irregular</option><option>amenorrhea</option><option>unknown</option></select></label>
        <label>Cycle interval (days)<input type="number" min="15" max="180" value={current.cycleLength ?? ""} onChange={(event) => update({ cycleLength: event.target.value, changeStatus: "changed" })} /></label>
        <label>Bleeding duration (days)<input type="number" min="0" max="30" value={current.bleedingDuration ?? ""} onChange={(event) => update({ bleedingDuration: event.target.value, changeStatus: "changed" })} /></label>
        <label>Flow<select value={current.flow ?? ""} onChange={(event) => update({ flow: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>light</option><option>moderate</option><option>heavy</option><option>variable</option></select></label>
      </> : null}
      {context === "infertility" ? <>
        <label>Induction-cycle status<input value={current.inductionStatus ?? ""} onChange={(event) => update({ inductionStatus: event.target.value, changeStatus: "changed" })} /></label>
        <label>Cycle number<input type="number" min="1" value={current.cycleNumber ?? ""} onChange={(event) => update({ cycleNumber: event.target.value, changeStatus: "changed" })} /></label>
        <label>Trigger date<input type="date" value={current.triggerDate ?? ""} onChange={(event) => update({ triggerDate: event.target.value, changeStatus: "changed" })} /></label>

> @prij-clinic/web@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json


codex
TypeScript passes for the web app. I also tightened â€œNo changeâ€ during pregnancy so it carries only a read-only pre-pregnancy baselineâ€”not ordinary cycle flagsâ€”into the new draft snapshot. The Overview now labels LMP as pregnancy dating, shows pregnancy-specific bleeding, and omits cycle-day presentation for pregnancy snapshots while keeping the signed historical timeline accessible.
  âœ“ Inspect branch, worktree, locked contract/spec, and relevant shared/web code
  âœ“ Implement and export pregnancy dating contract in packages/shared
  âœ“ Update ActiveVisitWorkspace and Patient Overview pregnancy behavior
  â†’ Run focused contract tests/type checks and review changed files
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node scripts/qa-pregnancy-edd-contract-test.mjs; if ($LASTEXITCODE -eq 0) { node scripts/feature-46-refractory-complaint-test.mjs }; if ($LASTEXITCODE -eq 0) { npm run typecheck -w packages/shared }; if ($LASTEXITCODE -eq 0) { npm run typecheck -w apps/web }' in C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace
 succeeded in 11743ms:
Pregnancy context separation and EDD provenance contract PASS
Feature 46 refractory complaint focused checks passed (no database used).

> @prij-clinic/shared@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json


> @prij-clinic/web@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$repo = '"'C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/qa-preg-edd-v2-workspace'; git -c safe.directory="'$repo diff --check; git -c safe.directory=$repo status --short; Write-Output '"'--- CHANGED FILES ---'; git -c safe.directory="'$repo diff --name-only; Write-Output '"'--- KEY LINES ---'; rg -n \"export type EddHistoryEntry|previousEdd|function ReproductiveStatusEditor|function PregnancyDatingEditor|Pre-pregnancy menstrual baseline|Confirm authoritative EDD|function WorkspaceContextOverviewCard|Pregnancy dating LMP|function MenstrualHistoryTimeline\" packages/shared/src/pregnancy-dating.ts apps/web/components/clinic/ActiveVisitWorkspace.tsx apps/web/app/patients/[id]/patient-components.tsx; Write-Output '--- LOCKED FILES ---'; git -c safe.directory="'$repo diff --name-only -- scripts/qa-pregnancy-edd-contract-test.mjs docs/verification/QA_PREGNANCY_EDD_IMPLEMENTATION_SPEC.md' in C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\qa-preg-edd-v2-workspace
 succeeded in 506ms:
 M apps/web/app/patients/[id]/patient-components.tsx
 M apps/web/components/clinic/ActiveVisitWorkspace.tsx
 M packages/shared/src/pregnancy-dating.ts
--- CHANGED FILES ---
apps/web/app/patients/[id]/patient-components.tsx
apps/web/components/clinic/ActiveVisitWorkspace.tsx
packages/shared/src/pregnancy-dating.ts
--- KEY LINES ---
packages/shared/src/pregnancy-dating.ts:12:export type EddHistoryEntry = {
packages/shared/src/pregnancy-dating.ts:21:  previousEdd?: string;
packages/shared/src/pregnancy-dating.ts:36:  previousEdd?: string;
packages/shared/src/pregnancy-dating.ts:166:      previousEdd: current?.previousEdd,
packages/shared/src/pregnancy-dating.ts:182:    ...(changesConfirmedEdd ? { previousEdd: currentEdd } : {}),
apps/web/components/clinic/ActiveVisitWorkspace.tsx:113:  previousEdd?: string;
apps/web/components/clinic/ActiveVisitWorkspace.tsx:667:function ReproductiveStatusEditor({ context, value, previous, pregnancyEpisode, infertilityEpisode, onChange }: { context: string; value?: ReproductiveSnapshot; previous?: ReproductiveSnapshot; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null; onChange: (value: ReproductiveSnapshot) => void }) {
apps/web/components/clinic/ActiveVisitWorkspace.tsx:704:        <div className="wide notice"><strong>Pre-pregnancy menstrual baseline</strong><p className="muted">Historical baseline preserved as read-only during active pregnancy: {baselineSummary(preservedBaseline)}</p></div>
apps/web/components/clinic/ActiveVisitWorkspace.tsx:747:function PregnancyDatingEditor({ current, pregnancyEpisode, pregnancyLmp, pregnancyEdd, update }: { current: ReproductiveSnapshot; pregnancyEpisode: Record<string, unknown> | null; pregnancyLmp: string; pregnancyEdd: string; update: (patch: Partial<ReproductiveSnapshot>) => void }) {
apps/web/components/clinic/ActiveVisitWorkspace.tsx:772:        previousEdd: current.previousEdd || stringOrUndefined(pregnancyEpisode?.previousEdd),
apps/web/components/clinic/ActiveVisitWorkspace.tsx:790:      {mode === "calculated" && source === "LMP" ? <><label>Pregnancy dating LMP<input type="date" value={current.lmp ?? dateOnly(pregnancyLmp)} onChange={(event) => update({ lmp: event.target.value, changeStatus: "changed" })} /></label><label>LMP certainty<select value={current.lmpCertainty ?? ""} onChange={(event) => update({ lmpCertainty: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>certain</option><option>uncertain</option></select></label></> : null}
apps/web/components/clinic/ActiveVisitWorkspace.tsx:798:      <div className="wide form-actions"><button className="button compact" type="button" onClick={confirmCandidate}>Confirm authoritative EDD</button>{current.previousEdd ? <span className="muted">Previous EDD: {current.previousEdd}</span> : null}{current.datingHistory?.length ? <span className="muted">datingHistory: {current.datingHistory.length} replacement(s)</span> : null}</div>
apps/web/app/patients/[id]/patient-components.tsx:889:function WorkspaceContextOverviewCard({ patient, context, related, onNavigate }: {
apps/web/app/patients/[id]/patient-components.tsx:939:    ["Pregnancy dating LMP", overviewDateIfPresent(overviewValue(context.pregnancy, ["lmp", "lmpDate"]) || latestSnapshot?.lmp || "")],
apps/web/app/patients/[id]/patient-components.tsx:1071:function MenstrualHistoryTimeline({ patientId, snapshots }: { patientId: string; snapshots: ReproductiveSummarySnapshot[] }) {
apps/web/app/patients/[id]/patient-components.tsx:1080:    <div className="menstrual-history-records">{filtered.map((snapshot, index) => <article key={`${snapshot.sourceEncounterId}-${index}`}><div className="data-row-header"><strong>{overviewDate(snapshot.visitDate ?? snapshot.confirmedAt ?? "")}</strong><span className="badge">{snapshot.changeStatus?.replaceAll("_", " ") || snapshot.context || "recorded"}</span></div><dl><div><dt>{snapshot.context === "pregnancy" ? "Pregnancy dating LMP" : "LMP"}</dt><dd>{snapshot.lmp ? overviewDate(snapshot.lmp) : "Not recorded"}</dd></div>{snapshot.lmp && snapshot.context !== "pregnancy" ? <div><dt>Cycle day</dt><dd>{cycleDay(snapshot.lmp) || "Not calculable"}</dd></div> : null}{snapshot.context === "pregnancy" ? <><div><dt>Pregnancy bleeding</dt><dd>{snapshot.pregnancyBleedingStatus?.replaceAll("_", " ") || "Not recorded"}</dd></div>{snapshot.pregnancyBleedingOnsetDate ? <div><dt>Bleeding onset</dt><dd>{overviewDate(snapshot.pregnancyBleedingOnsetDate)}</dd></div> : null}</> : <><div><dt>Pattern</dt><dd>{[snapshot.regularity, snapshot.cycleLength ? `${snapshot.cycleLength}-day interval` : "", snapshot.bleedingDuration ? `${snapshot.bleedingDuration}-day bleeding` : "", snapshot.flow].filter(Boolean).join(" Â· ") || "Not recorded"}</dd></div><div><dt>Flags</dt><dd>{snapshot.abnormalFlags?.join(", ") || "None recorded"}</dd></div></>}{snapshot.narrative ? <div><dt>Note</dt><dd>{snapshot.narrative}</dd></div> : null}</dl>{snapshot.sourceEncounterId ? <Link href={`/patients/${patientId}/visits/${snapshot.sourceEncounterId}/history`}>Open source encounter</Link> : null}</article>)}</div>
--- LOCKED FILES ---
warning: in the working copy of 'packages/shared/src/pregnancy-dating.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'packages/shared/src/pregnancy-dating.ts', LF will be replaced by CRLF the next time Git touches it

  âœ“ Inspect branch, worktree, locked contract/spec, and relevant shared/web code
  âœ“ Implement and export pregnancy dating contract in packages/shared
  âœ“ Update ActiveVisitWorkspace and Patient Overview pregnancy behavior
  âœ“ Run focused contract tests/type checks and review changed files
codex
Implemented QA-PREG-001 and QA-EDD-001 on `work/sprint1-qa-repair-batch`.

Changed files:

- [pregnancy-dating.ts](C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/qa-preg-edd-v2-workspace/packages/shared/src/pregnancy-dating.ts:12) â€” expanded replacement provenance, previous EDD, and dating history preservation.
- [ActiveVisitWorkspace.tsx](C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/qa-preg-edd-v2-workspace/apps/web/components/clinic/ActiveVisitWorkspace.tsx:667) â€” pregnancy-specific bleeding, read-only menstrual baseline, structured manual/calculated EDD previews, and explicit clinician confirmation/replacement workflow.
- [patient-components.tsx](C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/qa-preg-edd-v2-workspace/apps/web/app/patients/[id]/patient-components.tsx:889) â€” pregnancy-specific Overview labeling while retaining signed historical menstrual records.

`packages/shared/src/index.ts` already exported `pregnancy-dating`, so no edit was needed.

Validation passed:

- Locked pregnancy/EDD contract
- Feature 46 focused checks
- Shared TypeScript check
- Web TypeScript check
- `git diff --check`

Locked files were unchanged. No migration, database, reference-data, branch, staging, or commit operations were performed.
tokens used
180,454
```

### implementation.stdout.log
```text
Implemented QA-PREG-001 and QA-EDD-001 on `work/sprint1-qa-repair-batch`.

Changed files:

- [pregnancy-dating.ts](C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/qa-preg-edd-v2-workspace/packages/shared/src/pregnancy-dating.ts:12) â€” expanded replacement provenance, previous EDD, and dating history preservation.
- [ActiveVisitWorkspace.tsx](C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/qa-preg-edd-v2-workspace/apps/web/components/clinic/ActiveVisitWorkspace.tsx:667) â€” pregnancy-specific bleeding, read-only menstrual baseline, structured manual/calculated EDD previews, and explicit clinician confirmation/replacement workflow.
- [patient-components.tsx](C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/qa-preg-edd-v2-workspace/apps/web/app/patients/[id]/patient-components.tsx:889) â€” pregnancy-specific Overview labeling while retaining signed historical menstrual records.

`packages/shared/src/index.ts` already exported `pregnancy-dating`, so no edit was needed.

Validation passed:

- Locked pregnancy/EDD contract
- Feature 46 focused checks
- Shared TypeScript check
- Web TypeScript check
- `git diff --check`

Locked files were unchanged. No migration, database, reference-data, branch, staging, or commit operations were performed.
```

### qa-pregnancy-edd.stderr.log
```text
```

### qa-pregnancy-edd.stdout.log
```text
Pregnancy context separation and EDD provenance contract PASS
```

### setup-api-build.stderr.log
```text
```

### setup-api-build.stdout.log
```text

> @prij-clinic/api@0.1.0 build
> nest build

```

### setup-npm-ci.stderr.log
```text
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated npmlog@5.0.1: This package is no longer supported.
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead for a more spec-conformant and faster implementation
npm warn deprecated are-we-there-yet@2.0.0: This package is no longer supported.
npm warn deprecated gauge@3.0.2: This package is no longer supported.
npm warn deprecated tar@6.2.1: Old versions of tar are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated glob@10.4.5: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
```

### setup-npm-ci.stdout.log
```text

added 682 packages, and audited 686 packages in 33s

211 packages are looking for funding
  run `npm fund` for details

40 vulnerabilities (3 low, 12 moderate, 24 high, 1 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues possible (including breaking changes), run:
  npm audit fix --force

Some issues need review, and may require choosing
a different dependency.

Run `npm audit` for details.
```

### setup-prisma-generate.stderr.log
```text
```

### setup-prisma-generate.stdout.log
```text

> prij-clinic@0.1.0 prisma:generate
> npm run prisma:generate -w apps/api


> @prij-clinic/api@0.1.0 prisma:generate
> node scripts/prisma.cjs generate

Prisma schema loaded from prisma\schema.prisma

âœ” Generated Prisma Client (v5.22.0) to .\..\..\node_modules\@prisma\client in 1.60s

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate

```

### typecheck.stderr.log
```text
```

### typecheck.stdout.log
```text

> prij-clinic@0.1.0 typecheck
> npm run typecheck --workspaces --if-present


> @prij-clinic/api@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json


> @prij-clinic/web@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json


> @prij-clinic/shared@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json

```
