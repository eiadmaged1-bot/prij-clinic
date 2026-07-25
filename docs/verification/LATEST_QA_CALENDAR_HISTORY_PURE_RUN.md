# Latest QA Calendar History Pure Verify Run

- Run ID: `30178350009`
- Status: `completed`
- Conclusion: `failure`
- Head SHA: `f0097cbde7d7eb1185f5d1bea83d33b3fb10c31b`
- URL: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30178350009

## Run summary
```text

X security/rbac-scope-enforcement Prij QA Calendar History Pure Verify · 30178350009
Triggered via push about 3 minutes ago

JOBS
X patch-verify in 2m33s (ID 89730715739)
  ✓ Set up job
  ✓ Checkout deterministic controls
  ✓ Checkout QA repair branch
  ✓ Setup Node 22
  ✓ Apply guarded compact calendar and History patch
  ✓ Install dependencies
  ✓ Generate Prisma Client
  ✓ Run compact calendar and History contract
  ✓ Run pregnancy and EDD regression
  ✓ Run Feature 46 regression
  ✓ Run typecheck
  X Run production build
  - Commit verified Package 2 implementation
  - Post Setup Node 22
  ✓ Post Checkout QA repair branch
  ✓ Post Checkout deterministic controls
  ✓ Complete job

ANNOTATIONS
requesting annotations returned 403 Forbidden as the token does not have sufficient permissions. Note that it is not currently possible to create a fine-grained PAT with the `checks:read` permission.

To see what failed, try: gh run view 30178350009 --log-failed
View this run on GitHub: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30178350009
```

## Failed log tail
```text
patch-verify	Run production build	﻿2026-07-25T22:52:27.6252118Z ##[group]Run npm run build
patch-verify	Run production build	2026-07-25T22:52:27.6252600Z ^[[36;1mnpm run build^[[0m
patch-verify	Run production build	2026-07-25T22:52:27.6292275Z shell: /usr/bin/bash -e {0}
patch-verify	Run production build	2026-07-25T22:52:27.6292707Z ##[endgroup]
patch-verify	Run production build	2026-07-25T22:52:27.7261793Z 
patch-verify	Run production build	2026-07-25T22:52:27.7262659Z > prij-clinic@0.1.0 build
patch-verify	Run production build	2026-07-25T22:52:27.7263896Z > npm run build --workspaces --if-present
patch-verify	Run production build	2026-07-25T22:52:27.7264492Z 
patch-verify	Run production build	2026-07-25T22:52:27.8413886Z 
patch-verify	Run production build	2026-07-25T22:52:27.8422269Z > @prij-clinic/api@0.1.0 build
patch-verify	Run production build	2026-07-25T22:52:27.8444283Z > nest build
patch-verify	Run production build	2026-07-25T22:52:27.8460592Z 
patch-verify	Run production build	2026-07-25T22:52:47.9452789Z 
patch-verify	Run production build	2026-07-25T22:52:47.9464896Z > @prij-clinic/web@0.1.0 build
patch-verify	Run production build	2026-07-25T22:52:47.9465639Z > next build
patch-verify	Run production build	2026-07-25T22:52:47.9467013Z 
patch-verify	Run production build	2026-07-25T22:52:48.6476004Z ⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
patch-verify	Run production build	2026-07-25T22:52:48.6554876Z Attention: Next.js now collects completely anonymous telemetry regarding usage.
patch-verify	Run production build	2026-07-25T22:52:48.6580203Z This information is used to shape Next.js' roadmap and prioritize features.
patch-verify	Run production build	2026-07-25T22:52:48.6595239Z You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
patch-verify	Run production build	2026-07-25T22:52:48.6628987Z https://nextjs.org/telemetry
patch-verify	Run production build	2026-07-25T22:52:48.6653626Z 
patch-verify	Run production build	2026-07-25T22:52:48.7848580Z    ▲ Next.js 15.5.19
patch-verify	Run production build	2026-07-25T22:52:48.7854188Z 
patch-verify	Run production build	2026-07-25T22:52:48.8538695Z    Creating an optimized production build ...
patch-verify	Run production build	2026-07-25T22:53:02.4317870Z <w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|javascript/auto|/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/next/dist/build/webpack/loaders/next-flight-css-loader.js??ruleSet[1].rules[14].oneOf[5].use[0]!/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[1]!/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!/home/runner/work/prij-clinic/prij-clinic/workspace/apps/web/components/investigations/investigation-station-v3.module.css|ssr': No serializer registered for Warning
patch-verify	Run production build	2026-07-25T22:53:02.4328015Z <w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
patch-verify	Run production build	2026-07-25T22:53:03.3585951Z  ⚠ Compiled with warnings in 13.7s
patch-verify	Run production build	2026-07-25T22:53:03.3591740Z 
patch-verify	Run production build	2026-07-25T22:53:03.3592831Z ./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:03.3593926Z Warning
patch-verify	Run production build	2026-07-25T22:53:03.3594249Z 
patch-verify	Run production build	2026-07-25T22:53:03.3595268Z (177:65) autoprefixer: start value has mixed support, consider using flex-start instead
patch-verify	Run production build	2026-07-25T22:53:03.3596026Z 
patch-verify	Run production build	2026-07-25T22:53:03.3596443Z Import trace for requested module:
patch-verify	Run production build	2026-07-25T22:53:03.3597423Z ./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:03.3598410Z ./components/investigations/InvestigationStationV3.tsx
patch-verify	Run production build	2026-07-25T22:53:03.3598972Z 
patch-verify	Run production build	2026-07-25T22:53:03.3599927Z ./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:03.3600646Z Warning
patch-verify	Run production build	2026-07-25T22:53:03.3600940Z 
patch-verify	Run production build	2026-07-25T22:53:03.3601660Z (203:61) autoprefixer: start value has mixed support, consider using flex-start instead
patch-verify	Run production build	2026-07-25T22:53:03.3602384Z 
patch-verify	Run production build	2026-07-25T22:53:03.3602755Z Import trace for requested module:
patch-verify	Run production build	2026-07-25T22:53:03.3603715Z ./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:03.3604540Z ./components/investigations/InvestigationStationV3.tsx
patch-verify	Run production build	2026-07-25T22:53:03.3605072Z 
patch-verify	Run production build	2026-07-25T22:53:13.1965103Z <w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[2]!/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[3]!/home/runner/work/prij-clinic/prij-clinic/workspace/apps/web/app/globals.css': No serializer registered for Warning
patch-verify	Run production build	2026-07-25T22:53:13.1972983Z <w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
patch-verify	Run production build	2026-07-25T22:53:13.2356356Z <w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[3]!/home/runner/work/prij-clinic/prij-clinic/workspace/apps/web/components/investigations/investigation-station-v3.module.css': No serializer registered for Warning
patch-verify	Run production build	2026-07-25T22:53:13.2363527Z <w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
patch-verify	Run production build	2026-07-25T22:53:13.7139870Z  ⚠ Compiled with warnings in 8.5s
patch-verify	Run production build	2026-07-25T22:53:13.7153996Z 
patch-verify	Run production build	2026-07-25T22:53:13.7157367Z ./components/investigations/investigation-station-v3.module.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[3]!./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:13.7160286Z Warning
patch-verify	Run production build	2026-07-25T22:53:13.7160643Z 
patch-verify	Run production build	2026-07-25T22:53:13.7161314Z (177:65) autoprefixer: start value has mixed support, consider using flex-start instead
patch-verify	Run production build	2026-07-25T22:53:13.7161938Z 
patch-verify	Run production build	2026-07-25T22:53:13.7162298Z Import trace for requested module:
patch-verify	Run production build	2026-07-25T22:53:13.7165547Z ./components/investigations/investigation-station-v3.module.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[3]!./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:13.7168702Z ./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:13.7169627Z ./components/investigations/InvestigationStationV3.tsx
patch-verify	Run production build	2026-07-25T22:53:13.7170102Z 
patch-verify	Run production build	2026-07-25T22:53:13.7172964Z ./components/investigations/investigation-station-v3.module.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[3]!./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:13.7175689Z Warning
patch-verify	Run production build	2026-07-25T22:53:13.7176027Z 
patch-verify	Run production build	2026-07-25T22:53:13.7176716Z (203:61) autoprefixer: start value has mixed support, consider using flex-start instead
patch-verify	Run production build	2026-07-25T22:53:13.7177794Z 
patch-verify	Run production build	2026-07-25T22:53:13.7178133Z Import trace for requested module:
patch-verify	Run production build	2026-07-25T22:53:13.7181216Z ./components/investigations/investigation-station-v3.module.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[3]!./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:13.7184223Z ./components/investigations/investigation-station-v3.module.css
patch-verify	Run production build	2026-07-25T22:53:13.7185170Z ./components/investigations/InvestigationStationV3.tsx
patch-verify	Run production build	2026-07-25T22:53:13.7185671Z 
patch-verify	Run production build	2026-07-25T22:53:13.7187952Z ./app/globals.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[3]!./app/globals.css
patch-verify	Run production build	2026-07-25T22:53:13.7190321Z Warning
patch-verify	Run production build	2026-07-25T22:53:13.7190637Z 
patch-verify	Run production build	2026-07-25T22:53:13.7191368Z (6799:41) autoprefixer: end value has mixed support, consider using flex-end instead
patch-verify	Run production build	2026-07-25T22:53:13.7192099Z 
patch-verify	Run production build	2026-07-25T22:53:13.7192484Z Import trace for requested module:
patch-verify	Run production build	2026-07-25T22:53:13.7195007Z ./app/globals.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[3]!./app/globals.css
patch-verify	Run production build	2026-07-25T22:53:13.7197072Z ./app/globals.css
patch-verify	Run production build	2026-07-25T22:53:13.7197394Z 
patch-verify	Run production build	2026-07-25T22:53:13.7199773Z ./app/globals.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[3]!./app/globals.css
patch-verify	Run production build	2026-07-25T22:53:13.7201765Z Warning
patch-verify	Run production build	2026-07-25T22:53:13.7202049Z 
patch-verify	Run production build	2026-07-25T22:53:13.7202696Z (6852:61) autoprefixer: end value has mixed support, consider using flex-end instead
patch-verify	Run production build	2026-07-25T22:53:13.7203285Z 
patch-verify	Run production build	2026-07-25T22:53:13.7203826Z Import trace for requested module:
patch-verify	Run production build	2026-07-25T22:53:13.7206571Z ./app/globals.css.webpack[javascript/auto]!=!../../node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[2]!../../node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[10].use[3]!./app/globals.css
patch-verify	Run production build	2026-07-25T22:53:13.7208801Z ./app/globals.css
patch-verify	Run production build	2026-07-25T22:53:13.7209162Z 
patch-verify	Run production build	2026-07-25T22:53:13.7544881Z  ✓ Compiled successfully in 22.3s
patch-verify	Run production build	2026-07-25T22:53:13.7595188Z    Linting and checking validity of types ...
patch-verify	Run production build	2026-07-25T22:53:39.2167224Z 
patch-verify	Run production build	2026-07-25T22:53:39.2168270Z Failed to compile.
patch-verify	Run production build	2026-07-25T22:53:39.2168747Z 
patch-verify	Run production build	2026-07-25T22:53:39.2169058Z ./app/admin/data-hygiene/page.tsx
patch-verify	Run production build	2026-07-25T22:53:39.2170308Z 14:37  Warning: React Hook useEffect has a missing dependency: 'load'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2171177Z 
patch-verify	Run production build	2026-07-25T22:53:39.2171501Z ./app/external-intake/page.tsx
patch-verify	Run production build	2026-07-25T22:53:39.2172849Z 48:6  Warning: React Hook useEffect has a missing dependency: 'load'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2174053Z 
patch-verify	Run production build	2026-07-25T22:53:39.2174354Z ./app/ob-ultrasounds/page.tsx
patch-verify	Run production build	2026-07-25T22:53:39.2175745Z 26:37  Warning: React Hook useEffect has a missing dependency: 'load'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2176747Z 
patch-verify	Run production build	2026-07-25T22:53:39.2177132Z ./app/patients/[id]/patient-components.tsx
patch-verify	Run production build	2026-07-25T22:53:39.2178203Z 1230:10  Error: 'calendarTitle' is defined but never used.  @typescript-eslint/no-unused-vars
patch-verify	Run production build	2026-07-25T22:53:39.2178941Z 
patch-verify	Run production build	2026-07-25T22:53:39.2179395Z ./app/patients/[id]/ultrasounds/[scanId]/page.tsx
patch-verify	Run production build	2026-07-25T22:53:39.2181425Z 54:53  Warning: React Hook useEffect has missing dependencies: 'isNew' and 'loadScan'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2183600Z 55:56  Warning: React Hook useEffect has missing dependencies: 'loadDocuments' and 'scan'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2185548Z 56:50  Warning: React Hook useEffect has a missing dependency: 'loadPreviousScans'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2189459Z 184:507  Warning: React Hook useEffect has missing dependencies: 'api', 'documents', and 'patientId'. Either include them or remove the dependency array. If 'api' changes too often, find the parent component that defines it and wrap that definition in useCallback.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2194539Z 184:508  Warning: React Hook useEffect has a complex expression in the dependency array. Extract it to a separate variable so it can be statically checked.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2197785Z 189:231  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
patch-verify	Run production build	2026-07-25T22:53:39.2201855Z 189:836  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
patch-verify	Run production build	2026-07-25T22:53:39.2203974Z 
patch-verify	Run production build	2026-07-25T22:53:39.2204586Z ./components/investigations/EncounterInvestigationOrderBuilder.tsx
patch-verify	Run production build	2026-07-25T22:53:39.2207007Z 92:9  Warning: The 'catalogue' logical expression could make the dependencies of useMemo Hook (at line 93) change on every render. To fix this, wrap the initialization of 'catalogue' in its own useMemo() Hook.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2210395Z 92:9  Warning: The 'catalogue' logical expression could make the dependencies of useMemo Hook (at line 101) change on every render. To fix this, wrap the initialization of 'catalogue' in its own useMemo() Hook.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2211944Z 
patch-verify	Run production build	2026-07-25T22:53:39.2212435Z ./components/investigations/InvestigationStationV3.tsx
patch-verify	Run production build	2026-07-25T22:53:39.2215125Z 247:9  Warning: The 'catalogue' logical expression could make the dependencies of useMemo Hook (at line 249) change on every render. To fix this, wrap the initialization of 'catalogue' in its own useMemo() Hook.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2218036Z 247:9  Warning: The 'catalogue' logical expression could make the dependencies of useMemo Hook (at line 252) change on every render. To fix this, wrap the initialization of 'catalogue' in its own useMemo() Hook.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2220904Z 247:9  Warning: The 'catalogue' logical expression could make the dependencies of useMemo Hook (at line 264) change on every render. To fix this, wrap the initialization of 'catalogue' in its own useMemo() Hook.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2224049Z 248:9  Warning: The 'favorites' logical expression could make the dependencies of useMemo Hook (at line 264) change on every render. To fix this, wrap the initialization of 'favorites' in its own useMemo() Hook.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2225486Z 
patch-verify	Run production build	2026-07-25T22:53:39.2225893Z ./components/medications/DermatologyWorkspace.tsx
patch-verify	Run production build	2026-07-25T22:53:39.2227335Z 32:37  Warning: React Hook useEffect has a missing dependency: 'load'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2228325Z 
patch-verify	Run production build	2026-07-25T22:53:39.2228751Z ./components/medications/PharmacologyCompare.tsx
patch-verify	Run production build	2026-07-25T22:53:39.2230507Z 26:6  Warning: React Hook useEffect has a missing dependency: 'profiles'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
patch-verify	Run production build	2026-07-25T22:53:39.2231502Z 
patch-verify	Run production build	2026-07-25T22:53:39.2232433Z info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
patch-verify	Run production build	2026-07-25T22:53:39.2574757Z npm error Lifecycle script `build` failed with error:
patch-verify	Run production build	2026-07-25T22:53:39.2594263Z npm error code 1
patch-verify	Run production build	2026-07-25T22:53:39.2595392Z npm error path /home/runner/work/prij-clinic/prij-clinic/workspace/apps/web
patch-verify	Run production build	2026-07-25T22:53:39.2613786Z 
patch-verify	Run production build	2026-07-25T22:53:39.2626992Z npm error workspace @prij-clinic/web@0.1.0
patch-verify	Run production build	2026-07-25T22:53:39.2627658Z > @prij-clinic/shared@0.1.0 build
patch-verify	Run production build	2026-07-25T22:53:39.2644388Z npm error location /home/runner/work/prij-clinic/prij-clinic/workspace/apps/web
patch-verify	Run production build	2026-07-25T22:53:39.2645188Z > tsc --noEmit -p tsconfig.json
patch-verify	Run production build	2026-07-25T22:53:39.2663860Z 
patch-verify	Run production build	2026-07-25T22:53:39.2665753Z npm error command failed
patch-verify	Run production build	2026-07-25T22:53:39.2684091Z npm error command sh -c next build
patch-verify	Run production build	2026-07-25T22:53:39.2684587Z 
patch-verify	Run production build	2026-07-25T22:53:40.8302840Z ##[error]Process completed with exit code 1.
```
