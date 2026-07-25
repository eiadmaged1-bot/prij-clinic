# Latest Sprint 1 Integration Continuation Failure

- Run ID: 30170271601
- Run URL: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30170271601
- Prepare: success
- Integrate: success
- Environment: success
- Install/Prisma: success
- Six checks: failure
- Integration push: skipped
- QA branch: skipped

## Diagnostic tails

### build.stderr.log
```text
 âš  Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\package-lock.json as the root directory.
 To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats for more information.
 Detected additional lockfiles: 
   * C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\package-lock.json

<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|javascript/auto|C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\next-flight-css-loader.js??ruleSet[1].rules[14].oneOf[5].use[0]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[1]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web\components\investigations\investigation-station-v3.module.css|ssr': No serializer registered for Warning
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
 âš  Compiled with warnings in 17.8s

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

<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[3]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web\app\globals.css': No serializer registered for PostCSSSyntaxError
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> webpack/lib/ModuleBuildError -> PostCSSSyntaxError
<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[5].use[3]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web\components\investigations\investigation-station-v3.module.css': No serializer registered for Warning
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> Array { 2 items } -> webpack/lib/ModuleWarning -> Warning
Failed to compile.

./app/globals.css:7755:1
Syntax error: C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web\app\globals.css Unclosed block

 [90m 7753 | [39m[33m}[39m
 [90m 7754 | [39m
[1m[31m>[39m[22m[90m 7755 | [39m[36m@media[39m[36m [39m[36m(max-width: 390px)[39m [33m{[39m
 [90m      | [39m[1m[31m^[39m[22m
 [90m 7756 | [39m  [33m.approved-patient-profile-shell[39m [33m.patient-smart-primary[39m [33m{[39m grid-template-columns[33m:[39m 48px [36mminmax[39m[36m(0, 1fr)[39m[33m;[39m [33m}[39m
 [90m 7757 | [39m  [33m.approved-patient-profile-shell[39m [33m.patient-smart-avatar[39m [33m{[39m width[33m:[39m 48px[33m;[39m height[33m:[39m 48px[33m;[39m border-radius[33m:[39m 15px[33m;[39m [33m}[39m

./app/globals.css
Syntax error: C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web\app\globals.css Unclosed block (7755:1)

 [90m 7753 | [39m[33m}[39m
 [90m 7754 | [39m
[1m[31m>[39m[22m[90m 7755 | [39m[36m@media[39m[36m [39m[36m(max-width: 390px)[39m [33m{[39m
 [90m      | [39m[1m[31m^[39m[22m
 [90m 7756 | [39m  [33m.approved-patient-profile-shell[39m [33m.patient-smart-primary[39m [33m{[39m grid-template-columns[33m:[39m 48px [36mminmax[39m[36m(0, 1fr)[39m[33m;[39m [33m}[39m
 [90m 7757 | [39m  [33m.approved-patient-profile-shell[39m [33m.patient-smart-avatar[39m [33m{[39m width[33m:[39m 48px[33m;[39m height[33m:[39m 48px[33m;[39m border-radius[33m:[39m 15px[33m;[39m [33m}[39m

    at tryRunOrWebpackError (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:316119)
    at __webpack_require_module__ (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:131532)
    at __nested_webpack_require_161494__ (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:130967)
    at C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:131824
    at symbolIterator (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\neo-async\async.js:1:14444)
    at done (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\neo-async\async.js:1:14824)
    at Hook.eval [as callAsync] (eval at create (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:14:9224), <anonymous>:15:1)
    at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:14:6378)
    at C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:130687
    at symbolIterator (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\neo-async\async.js:1:14402)
-- inner error --
Syntax error: C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web\app\globals.css Unclosed block (7755:1)

 [90m 7753 | [39m[33m}[39m
 [90m 7754 | [39m
[1m[31m>[39m[22m[90m 7755 | [39m[36m@media[39m[36m [39m[36m(max-width: 390px)[39m [33m{[39m
 [90m      | [39m[1m[31m^[39m[22m
 [90m 7756 | [39m  [33m.approved-patient-profile-shell[39m [33m.patient-smart-primary[39m [33m{[39m grid-template-columns[33m:[39m 48px [36mminmax[39m[36m(0, 1fr)[39m[33m;[39m [33m}[39m
 [90m 7757 | [39m  [33m.approved-patient-profile-shell[39m [33m.patient-smart-avatar[39m [33m{[39m width[33m:[39m 48px[33m;[39m height[33m:[39m 48px[33m;[39m border-radius[33m:[39m 15px[33m;[39m [33m}[39m

    at Object.<anonymous> (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[3]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web\app\globals.css:1:7)
    at C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:962717
    at Hook.eval [as call] (eval at create (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:14:9002), <anonymous>:7:1)
    at Hook.CALL_DELEGATE [as _call] (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:14:6272)
    at C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:131565
    at tryRunOrWebpackError (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:316073)
    at __webpack_require_module__ (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:131532)
    at __nested_webpack_require_161494__ (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:130967)
    at C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\webpack\bundle5.js:29:131824
    at symbolIterator (C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\compiled\neo-async\async.js:1:14444)

Generated code for C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\css-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[2]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\node_modules\next\dist\build\webpack\loaders\postcss-loader\src\index.js??ruleSet[1].rules[14].oneOf[10].use[3]!C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web\app\globals.css

Import trace for requested module:
./app/globals.css


> Build failed because of webpack errors
npm error Lifecycle script `build` failed with error:
npm error code 1
npm error path C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web
npm error workspace @prij-clinic/web@0.1.0
npm error location C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web
npm error command failed
npm error command C:\WINDOWS\system32\cmd.exe /d /s /c next build

```

### build.stdout.log
```text

> prij-clinic@0.1.0 build
> npm run build --workspaces --if-present


> @prij-clinic/api@0.1.0 build
> nest build


> @prij-clinic/web@0.1.0 build
> next build

âš  No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

   â–² Next.js 15.5.19

   Creating an optimized production build ...

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
    '  const [visit, setVisit] = useState<DoctorVisitState | null>(null);\n' +
    '  const [status, setStatus] = useState("Loading locked visit context.");\n' +
    '  const [error, setError] = useState("");\n' +
    '  const [encounterForm, setEncounterForm] = useState<Record<string, unknown>>({});\n' +
    '  const [medicationQuery, setMedicationQuery] = useState("");\n' +
    '  const [medicationResults, setMedicationResults] = useState<MedicationResult[]>([]);\n' +
    '  const [lines, setLines] = useState<PrescriptionLine[]>([]);\n' +
    '  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);\n' +
    '  const [shortcuts, setShortcuts] = useState<Record<string, unknown>[]>([]);\n' +
    '  const [safety, setSafety] = useState<Record<string, unknown> | null>(null);\n' +
    '  const [investigationQuery, setInvestigationQuery] = useState("");\n' +
    '  const [investigationCategory, setInvestigationCategory] = useState("");\n' +
    '  const [catalog, setCatalog] = useState<Array<{ id: string; name: string; category: string; subcategory?: string | null }>>([]);\n' +
    '  const [basket, setBasket] = useState<Array<{ id: string; name: string; category: string; note?: string }>>([]);\n' +
    '  const [followUp, setFollowUp] = useState({ dueAt: "", title: "", note: "" });\n' +
    '  const [voidModalOpen, setVoidModalOpen] = useState(false);\n' +
    '  const [voidReason, setVoidReason] = useState("");\n' +
    '  const [isVoiding, setIsVoiding] = useState(false);\n' +
    '  const [voidError, setVoidError] = useState("");\n' +
    '  const [saveState, setSaveState] = useState<"synced" | "unsaved" | "local" | "syncing" | "failed" | "offline">("synced");\n' +
    '  const [finishing, setFinishing] = useState(false);\n' +
    '  const draftKey = `prij:unsigned-visit:${patientId}:${visitId}`;\n' +
    '\n' +
    '  const roles = user?.roles ?? [];\n' +
    '  const canUseDoctorVisit = hasAnyRolePermission(roles, Action.VISIT_START) || roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));\n' +
    '  const patient = visit?.patient as Record<string, string | null> | undefined;\n' +
    '  const encounter = visit?.encounter as Record<string, unknown> | undefined;\n' +
    '  const signedVisit = encounter?.status === "signed";\n' +
    '  const contextReady = Boolean(patientId && visitId && patient?.id === patientId && encounter?.id === visitId);\n' +
    '\n' +
    '  const loadVisit = useCallback(async () => {\n' +
    '    try {\n' +
    '      let data = await getCurrentDoctorVisit(patientId);\n' +
    '      if (String(data.encounter?.id ?? "") !== visitId) {\n' +
    '        data = await getDoctorVisitPacket(patientId, visitId);\n' +
    '      }\n' +
    '      setVisit(data);\n' +
    '      const complaintLifecycle = complaintLifecycleFromEncounter((data.encounter ?? {}) as Record<string, unknown>);\n' +
    '      const serverForm: Record<string, unknown> = {\n' +
    '        chiefComplaint: String(data.encounter?.chiefComplaint ?? ""),\n' +
    '        complaintStatus: complaintLifecycle?.status ?? "ACTIVE",\n' +
    '        historyText: String(data.encounter?.historyText ?? ""),\n' +
    '        examText: String(data.encounter?.examText ?? ""),\n' +
    '        assessmentText: String(data.encounter?.assessmentText ?? ""),\n' +
    '        planText: String(data.encounter?.planText ?? ""),\n' +
    '        examinationJson: structuredInput(data.encounter?.examinationJson)\n' +
    '      };\n' +
    '      const recovered = String(data.encounter?.status ?? "") === "draft" ? readLocalVisitDraft(draftKey) : null;\n' +
    '      setEncounterForm(recovered ? { ...serverForm, ...recovered } : serverForm);\n' +
    '      setSaveState(recovered ? "local" : "synced");\n' +
    '      setError("");\n' +
    '      setStatus("");\n' +
    '    } catch {\n' +
    '      setError("Patient context is required before documenting this visit.");\n' +
    '      setStatus("Could not load locked visit context.");\n' +
    '    }\n' +
    '  }, [draftKey, patientId, visitId]);\n' +
    '\n' +
    '  useEffect(() => {\n' +
    '    if (!contextReady || saveState !== "unsaved") return;\n' +
    '    const timer = window.setTimeout(() => {\n' +
    '      try {\n' +
    '        localStorage.setItem(draftKey, JSON.stringify(encounterForm));\n' +
    '        setSaveState(navigator.onLine ? "local" : "offline");\n' +
    '      } catch {\n' +
    '        setSaveState("failed");\n' +
    '      }\n' +
    '    }, 350);\n' +
    '    return () => window.clearTimeout(timer);\n' +
    '  }, [contextReady, draftKey, encounterForm, saveState]);\n' +
    '\n' +
    '  useEffect(() => {\n' +
    '    if (!patientId || !visitId) {\n' +
    '      setError("Patient context is required before documenting this visit.");\n' +
    '      return;\n' +
    '    }\n' +
    '    void loadVisit();\n' +
    '  }, [loadVisit, patientId, visitId]);\n' +
    '\n' +
    '  useEffect(() => {\n' +
    '    if (activeModule !== "prescription") return;\n' +
    '    void Promise.all([apiGet("/prescriptions/templates"), apiGet("/prescriptions/shortcuts")]).then(([templateData, shortcutData]) => {\n' +
    '      setTemplates((templateData.prescriptionTemplates ?? []) as Record<string, unknown>[]);\n' +
    '      setShortcuts((shortcutData.doctorMedicationShortcuts ?? []) as Record<string, unknown>[]);\n' +
    '    });\n' +
    '  }, [activeModule]);\n' +
    '\n' +
    '  useEffect(() => {\n' +
    '    if (activeModule !== "prescription") return;\n' +
    '    const query = medicationQuery.trim();\n' +
    '    if (query.length < 2) {\n' +
    '      setMedicationResults([]);\n' +
    '      return;\n' +
    '    }\n' +
    '    const timer = window.setTimeout(() => {\n' +
    '      void apiPost("/medications/search", { query }).then(async (response) => {\n' +
    '        const data = response.ok ? await response.json() as { results?: MedicationResult[] } : {};\n' +
    '        setMedicationResults((data.results ?? []).filter((item) => item.type !== "family").slice(0, 12));\n' +
    '      });\n' +
    '    }, 220);\n' +
    '    return () => window.clearTimeout(timer);\n' +
    '  }, [activeModule, medicationQuery]);\n' +
    '\n' +
    '  useEffect(() => {\n' +
    '    if (activeModule !== "investigations") return;\n' +
    '    const params = new URLSearchParams();\n' +
    '    if (investigationQuery.trim()) params.set("q", investigationQuery.trim());\n' +
    '    if (investigationCategory) params.set("category", investigationCategory);\n' +
    '    if (!params.toString()) {\n' +
    '      setCatalog([]);\n' +
    '      return;\n' +
    '    }\n' +
    '    const timer = window.setTimeout(() => {\n' +
    '      void apiGet(`/investigations/catalog?${params.toString()}`).then((data) '... 52323 more characters,
  expected: /complaint-status-badge \$\{form\.complaintStatus === "REFRACTORY"/,
  operator: 'match',
  diff: 'simple'
}

Node.js v22.23.1
```

### feature46.stdout.log
```text
```

### fix3-medication.stderr.log
```text
node:internal/fs/promises:639
  return new FileHandle(await PromisePrototypeThen(
                        ^

Error: ENOENT: no such file or directory, open 'C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\local-reference\egyptian-drugs\egyptian-drugs.csv'
    at async open (node:internal/fs/promises:639:25)
    at async readFile (node:internal/fs/promises:1252:14)
    at async file:///C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/workspace-cont/scripts/recovery-fix3-medication-test.mjs:15:17 {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'open',
  path: 'C:\\Users\\SuperUser\\actions-runner\\_work\\prij-clinic\\prij-clinic\\workspace-cont\\local-reference\\egyptian-drugs\\egyptian-drugs.csv'
}

Node.js v22.23.1
```

### fix3-medication.stdout.log
```text
```

### fix3-search.stderr.log
```text
node:internal/modules/cjs/loader:1430
  const err = new Error(message);
              ^

Error: Cannot find module '../apps/api/dist/prisma/prisma.service.js'
Require stack:
- C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\scripts\recovery-fix3-search-test.mjs
    at Function._resolveFilename (node:internal/modules/cjs/loader:1430:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1040:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1045:22)
    at Function._load (node:internal/modules/cjs/loader:1216:25)
    at wrapModuleLoad (node:internal/modules/cjs/loader:254:19)
    at Module.require (node:internal/modules/cjs/loader:1527:12)
    at require (node:internal/modules/helpers:147:16)
    at file:///C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/workspace-cont/scripts/recovery-fix3-search-test.mjs:7:27
    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:681:26) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\SuperUser\\actions-runner\\_work\\prij-clinic\\prij-clinic\\workspace-cont\\scripts\\recovery-fix3-search-test.mjs'
  ]
}

Node.js v22.23.1
```

### fix3-search.stdout.log
```text
```

### typecheck.stderr.log
```text
npm error Lifecycle script `typecheck` failed with error:
npm error code 2
npm error path C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web
npm error workspace @prij-clinic/web@0.1.0
npm error location C:\Users\SuperUser\actions-runner\_work\prij-clinic\prij-clinic\workspace-cont\apps\web
npm error command failed
npm error command C:\WINDOWS\system32\cmd.exe /d /s /c tsc --noEmit -p tsconfig.json

```

### typecheck.stdout.log
```text

> prij-clinic@0.1.0 typecheck
> npm run typecheck --workspaces --if-present


> @prij-clinic/api@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json


> @prij-clinic/web@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json

components/clinic/ActiveVisitWorkspace.tsx(498,42): error TS2304: Cannot find name 'ChipList'.
components/clinic/ActiveVisitWorkspace.tsx(498,59): error TS2304: Cannot find name 'examinationChips'.
components/clinic/ActiveVisitWorkspace.tsx(498,86): error TS7006: Parameter 'label' implicitly has an 'any' type.
components/clinic/ActiveVisitWorkspace.tsx(498,126): error TS2304: Cannot find name 'appendText'.
components/clinic/ActiveVisitWorkspace.tsx(501,19): error TS2322: Type '{}' is not assignable to type 'string | number | readonly string[] | undefined'.

> @prij-clinic/shared@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json

```
