# Latest Feature 46 Final Integration V2 Failure

- Run ID: 30174035180
- Prepare: success
- Integrate: success
- Environment: success
- Install/Prisma/references/API build: success
- Six checks: success
- Integration push: failure
- QA branch: skipped

## Diagnostic tails

### build.stderr.log
```text
 âš  Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\package-lock.json as the root directory.
 To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats for more information.
 Detected additional lockfiles: 
   * C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\package-lock.json

<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|javascript/auto|C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\node_modules\next\dist\build\webpack\loaders\next-flight-css-loader.js??ruleSet[1].rules[14].oneOf[5].use[0]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[1]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\apps\web\components\investigations\investigation-station-v3.module.css|ssr': No serializer registered for Warning
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
 âš  Compiled with warnings in 17.6s

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

<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[3]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\apps\web\app\globals.css': No serializer registered for Warning
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[3]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\v2-workspace\apps\web\components\investigations\investigation-station-v3.module.css': No serializer registered for Warning
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
 âš  Compiled with warnings in 5.9s

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
   Collecting page data ...
   Generating static pages (0/84) ...
   Generating static pages (21/84) 
   Generating static pages (42/84) 
   Generating static pages (63/84) 
 âœ“ Generating static pages (84/84)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                           Size  First Load JS
â”Œ â—‹ /                                                148 B         103 kB
â”œ â—‹ /_not-found                                      990 B         104 kB
â”œ â—‹ /admin                                           171 B         134 kB
â”œ â—‹ /admin/accounts                                4.53 kB         136 kB
â”œ â—‹ /admin/appearance                              4.13 kB         135 kB
â”œ â—‹ /admin/audit                                   1.75 kB         133 kB
â”œ â—‹ /admin/calculators                             1.76 kB         133 kB
â”œ â—‹ /admin/care-assist                               167 B         131 kB
â”œ â—‹ /admin/data-hygiene                            2.03 kB         133 kB
â”œ â—‹ /admin/drug-market                               177 B         142 kB
â”œ â—‹ /admin/drug-market/automation                    177 B         142 kB
â”œ â—‹ /admin/drug-market/coverage                      175 B         142 kB
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
â”œ â—‹ /calculators                                   3.28 kB         134 kB
â”œ â—‹ /calendar                                        171 B         136 kB
â”œ â—‹ /care-assist                                     180 B         131 kB
â”œ â—‹ /clinic-day/walkthrough                          186 B         131 kB
â”œ Æ’ /clinical-requests/[id]/print                  2.44 kB         105 kB
â”œ â—‹ /clinical-tags                                  4.3 kB         135 kB
â”œ â—‹ /consents                                        180 B         131 kB
â”œ â—‹ /dashboard                                     3.29 kB         134 kB
â”œ â—‹ /dermatology                                   3.93 kB         135 kB
â”œ â—‹ /doctor                                        3.23 kB         167 kB
â”œ â—‹ /doctor/case-library                           3.73 kB         135 kB
â”œ â—‹ /doctor/visit                                  2.13 kB         133 kB
â”œ â—‹ /doctor/waiting                                  144 B         171 kB
â”œ â—‹ /documents                                       144 B         171 kB
â”œ â—‹ /drug-market                                     177 B         142 kB
â”œ Æ’ /drug-market/products/[id]                       803 B         142 kB
â”œ â—‹ /drug-market/search                              177 B         142 kB
â”œ â—‹ /encounters                                    1.55 kB         133 kB
â”œ â—‹ /external-intake                               4.59 kB         139 kB
â”œ â—‹ /finance                                         170 B         136 kB
â”œ â—‹ /guidelines                                      133 B         137 kB
â”œ Æ’ /guidelines/[id]                               6.97 kB         138 kB
â”œ â—‹ /guidelines/ask                                  133 B         138 kB
â”œ â—‹ /guidelines/imports                              133 B         138 kB
â”œ â—‹ /guidelines/private-vault                        133 B         138 kB
â”œ â—‹ /guidelines/review                               133 B         138 kB
â”œ â—‹ /guidelines/search                               133 B         137 kB
â”œ â—‹ /guidelines/sources                              133 B         138 kB
â”œ â—‹ /guidelines/updates                              133 B         138 kB
â”œ â—‹ /guidelines/upload                               133 B         138 kB
â”œ â—‹ /inbox                                         1.45 kB         133 kB
â”œ â—‹ /investigations                                  177 B         143 kB
â”œ â—‹ /investigations/manage                         2.82 kB         134 kB
â”œ â—‹ /login                                         3.51 kB         121 kB
â”œ â—‹ /medications                                   1.09 kB         143 kB
â”œ â—‹ /medications/families                            177 B         142 kB
â”œ â—‹ /medications/herbals                             175 B         142 kB
â”œ â—‹ /medications/safety                              176 B         142 kB
â”œ â—‹ /medications/search                              148 B         103 kB
â”œ â—‹ /ob-ultrasounds                                  170 B         134 kB
â”œ â—‹ /orders                                          180 B         131 kB
â”œ â—‹ /owner-control                                   171 B         134 kB
â”œ Æ’ /owner/diagnostics                               148 B         103 kB
â”œ â—‹ /patients                                      3.81 kB         135 kB
â”œ Æ’ /patients/[id]                                 45.9 kB         220 kB
â”œ Æ’ /patients/[id]/print/packet                    1.84 kB         105 kB
â”œ Æ’ /patients/[id]/ultrasounds/[scanId]            6.76 kB         138 kB
â”œ Æ’ /patients/[id]/visits/[visitId]/[[...module]]    185 B         164 kB
â”œ Æ’ /patients/[id]/workspace-editor                7.08 kB         138 kB
â”œ â—‹ /patients/import                               4.32 kB         135 kB
â”œ â—‹ /patients/new                                  7.01 kB         142 kB
â”œ â—‹ /pregnancies                                     180 B         131 kB
â”œ â—‹ /pregnancy                                       180 B         131 kB
â”œ â—‹ /prescriptions                                 6.44 kB         138 kB
â”œ Æ’ /prescriptions/[id]/print                      2.76 kB         106 kB
â”œ â—‹ /protocol-atlas                                3.17 kB         134 kB
â”œ Æ’ /protocol-atlas/[id]                           3.11 kB         134 kB
â”œ â—‹ /queue                                           144 B         171 kB
â”œ â—‹ /reception                                     1.71 kB         136 kB
â”œ â—‹ /reception/check-in                            3.48 kB         138 kB
â”œ â—‹ /reception/qr-scan                             5.24 kB         140 kB
â”œ â—‹ /reception/today                                 148 B         103 kB
â”œ â—‹ /referrals                                       180 B         131 kB
â”œ Æ’ /referrals/[id]/print                          1.74 kB         105 kB
â”œ â—‹ /reports                                         144 B         171 kB
â”œ â—‹ /staff-chat                                    1.83 kB         133 kB
â”œ â—‹ /tasks                                           180 B         131 kB
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
{"status":"PASS","timings":{"Panadol":216,"Paracetamol":61,"Pa":103,"Glucophage":138,"Metformin":53,"Augmentin":144,"Amoxicillin":50,"Ø£ÙˆØ¬Ù…ÙŠÙ†ØªÙŠÙ†":143,"Ø¬Ù„ÙˆÙƒÙˆÙØ§Ø¬ÙŠ":125}}
```

### resolver.stderr.log
```text
```

### resolver.stdout.log
```text
Deterministic Sprint 1 Fix 3 + Feature 46 conflict resolution complete.
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
