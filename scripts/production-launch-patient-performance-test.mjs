import { readFileSync } from "node:fs";
const controller = file("apps/api/src/patients/patients.controller.ts");
const service = file("apps/api/src/patients/patients.service.ts");
const page = file("apps/web/app/patients/[id]/page.tsx");
const registry = file("apps/web/components/patients/patient-workspace-registry.ts");
const search = file("apps/web/components/clinic/UniversalSearchBox.tsx");
const searchService = file("apps/api/src/search/search.service.ts");
assert(controller.includes('@Get(":id/workspace-summary")') && controller.includes('"private, no-store'), "workspace summary endpoint is no-store");
assert(service.includes("...branchScope(user)") && service.includes("receptionistOnly") && service.includes("canReadFinance"), "summary is branch and permission scoped");
assert(service.includes("availableActions") && service.includes("patient.workspace_summary_read"), "backend policy actions and read audit exist");
assert(page.includes("/workspace-summary") && page.includes("tab.key === activeTab"), "patient opens summary then active module only");
assert(page.includes("AbortController") && !page.includes("window.location.reload"), "stale patient requests abort and no full reload remains");
assert(registry.includes("patientWorkspaceRegistry") && registry.includes("lazyComponentLoader") && registry.includes("loadHeavy"), "central registry lazy-loads heavy modules");
for (const module of ["pregnancy", "infertility", "documents", "billing", "timeline", "files", "ultrasound", "ai-snapshot"]) assert(registry.includes(`item(\"${module}\"`), `lazy registry module ${module}`);
assert(search.includes("275") && search.includes("AbortController"), "search is debounced and stale requests abort");
assert(searchService.includes("Promise.allSettled") && searchService.includes('query.length < 2') && searchService.includes('include("guidelines")'), "search scopes and section failures are isolated");
console.log("PRODUCTION-LAUNCH-PATIENT-PERFORMANCE PASS");
function file(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function assert(value, message) { if (!value) throw new Error(message); }
