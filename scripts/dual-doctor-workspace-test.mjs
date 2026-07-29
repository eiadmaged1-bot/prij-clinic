import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [router, controller, cockpit, preferenceClient, preferenceApi, preferenceService, schema, encounterApi, encounterService, doctorVisitService, client, renderer] = await Promise.all([
  readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8"),
  readFile("apps/web/components/clinic/SharedEncounterWorkspaceController.tsx", "utf8"),
  readFile("apps/web/components/clinic/VisitCockpitWorkspace.tsx", "utf8"),
  readFile("apps/web/lib/interface-mode.ts", "utf8"),
  readFile("apps/api/src/users/users.controller.ts", "utf8"),
  readFile("apps/api/src/users/users.service.ts", "utf8"),
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/src/encounters/encounters.controller.ts", "utf8"),
  readFile("apps/api/src/encounters/encounters.service.ts", "utf8"),
  readFile("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8"),
  readFile("apps/web/lib/doctor-visit.ts", "utf8"),
  readFile("apps/web/app/patients/[id]/workspace-module-renderer.tsx", "utf8")
]);

// 1-3. Both presentations receive one controller and starting a visit reuses the doctor-scoped draft.
assert.equal((router.match(/useSharedEncounterWorkspaceController\(/g) ?? []).length, 1, "workspace router must create exactly one shared controller");
assert(router.includes("<VisitCockpitWorkspace controller={controller}") && router.includes("<ClassicDoctorWorkspace controller={controller}"), "Classic and Cockpit must receive the same controller instance");
assert(doctorVisitService.includes("const existing = await this.prisma.encounter.findFirst") && doctorVisitService.includes("const encounter = existing ?? await this.prisma.encounter.create"), "mode opening must reuse an existing draft instead of creating a duplicate encounter");
assert(renderer.includes("ActiveVisitLauncher") && !renderer.includes("<ClinicalInputFoundation patient={patient}"), "patient Current Visit entry must open the shared engine instead of a competing local draft");

// 4-7. Account-scoped preference, Classic default, and role restrictions.
assert(schema.includes("doctorWorkspaceMode  DoctorWorkspaceMode  @default(CLASSIC)"), "Classic must remain the database default");
assert(preferenceService.includes("doctorWorkspaceMode: true") && preferenceClient.includes("/users/me/preferences"), "doctor workspace preference must persist through server preferences");
assert(preferenceApi.includes('role === "Doctor" || role === "Owner"') && preferenceApi.includes("ForbiddenException"), "Doctor and Owner must be allowed while other roles are denied");
assert(router.includes("if (!ready)") && router.includes('doctorWorkspaceMode === "COCKPIT"'), "server preference readiness must gate workspace routing");

// 8-10. Review is the only sign gateway, readiness is server-authoritative, and revisions are enforced.
assert(!router.includes(">Finish visit</button>") && !router.includes(">Finish and print</button>"), "Classic must not expose a direct Finish bypass");
assert.equal((client.match(/\/encounters\/\$\{encodeURIComponent\(encounterId\)\}\/sign/g) ?? []).length, 1, "client must expose one encounter completion request");
assert(encounterApi.includes('@Get(":id/readiness")') && encounterApi.includes("SignEncounterDto"), "API must publish readiness and typed sign input");
assert(encounterService.includes("CHIEF_COMPLAINT_REQUIRED") && encounterService.includes("ENCOUNTER_NOT_READY"), "server must reject incomplete completion with structured readiness issues");
assert(encounterService.includes("ENCOUNTER_VERSION_CONFLICT") && encounterService.includes('updatedAt: new Date(expectedRevision)'), "server must atomically reject stale completion");
const signMethod = encounterService.slice(encounterService.indexOf("async sign("), encounterService.indexOf("async voidEncounter("));
assert(signMethod.includes('if (existing.status === "signed")') && signMethod.indexOf('if (existing.status === "signed")') < signMethod.indexOf("encounterReadiness(existing"), "duplicate completion must return the signed encounter idempotently");

// 11-14. Review issues, resource errors, sync states, and immutable completed encounters.
assert(cockpit.includes("Blocking issues") && cockpit.includes("issue.message") && router.includes("Blocking review issues"), "both Review presentations must render structured readiness issues");
assert(controller.includes('"resource-failed"') && cockpit.includes("Clinical resources unavailable") && cockpit.includes("retry={controller.reload}"), "resource failure must render as a recoverable error, not an empty record list");
assert(doctorVisitService.includes("Promise.allSettled") && doctorVisitService.includes("resourceErrors") && cockpit.includes("Retry before interpreting this as no history"), "partial related-resource failure must remain distinguishable from a true empty state");
for (const state of ["saving", "saved", "failed", "offline", "waiting-sync", "conflict"]) assert(controller.includes(`"${state}"`), `shared controller missing ${state} state`);
assert(controller.includes('status !== "draft"') && controller.includes('setSaveState("completed")'), "completed encounters must become read-only");
assert(controller.includes("editVersionRef") && controller.includes("Newer edits are still waiting to sync"), "an in-flight save must not clear newer local edits");
assert(cockpit.includes("failedResources") && cockpit.includes('resources: ["investigations", "history"]'), "mixed longitudinal groups must surface every failed source instead of a false empty state");
assert(encounterService.includes("Signed or voided encounters cannot be edited"), "server must keep completed encounters immutable");

// 15-16. Canonical English/Arabic stage order and keyboard operation.
for (const stage of ["Patient Context", "History", "Examination", "Assessment", "Investigations", "Plan", "Review"]) assert(controller.includes(`label: "${stage}"`), `canonical stage missing: ${stage}`);
assert(cockpit.includes('dir={rtl ? "rtl" : "ltr"}') && cockpit.includes("stage.ar") && cockpit.includes('event.key === "ArrowRight"') && cockpit.includes('event.key === "ArrowLeft"') && cockpit.includes('event.key === "Home"') && cockpit.includes('event.key === "End"'), "stage control must support RTL and keyboard ordering");

// 17. Classic retains its established clinical modules while sharing save and finish operations.
for (const moduleName of ["complaint", "history", "examination", "impression", "prescription", "investigations", "ultrasound", "follow-up", "finish"]) assert(router.includes(`["${moduleName}"`) || router.includes(`=== "${moduleName}"`), `Classic module missing: ${moduleName}`);
assert(router.includes("controller.save()") && router.includes("controller.finish()"), "Classic must use shared persistence and completion");

console.log("Dual doctor workspace safety contracts PASS");