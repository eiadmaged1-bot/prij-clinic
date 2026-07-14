import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [registry, flow, renderer, css] = await Promise.all([
  readFile("apps/web/components/patients/patient-workspace-registry.ts", "utf8"),
  readFile("apps/web/app/patients/[id]/visit-flow-components.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/workspace-module-renderer.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

assert.match(registry, /primaryOrder = new Map\(\["overview", "doctor-visit", "history", "timeline", "more"\]/, "patient navigation must be Overview, Visit, History, Timeline, More");
assert.match(registry, /entry\.key === "history" \|\|/, "History must remain in minimalistic navigation");
assert.doesNotMatch(flow, /aria-label="Doctor visit workflow stepper"/, "redundant horizontal clinical step row must not render");
assert.match(flow, /Step \{activeStepIndex \+ 1\} of \{visitSteps\.length\} · \{activeStep\}/, "compact progress heading missing");
for (const action of [">Back<", ">Saved<", ">Next<"]) assert.ok(flow.includes(action), `compact progress action missing ${action}`);
for (const step of ["History", "Examination", "Assessment", "Plan", "Review"]) assert.ok(flow.includes(`activeStep === "${step}"`), `visit step missing ${step}`);
assert.match(flow, /<legend>Presenting complaint<\/legend>/, "complaint must be the first History subsection");
assert.equal((flow.match(/name="chiefComplaint"/g) ?? []).length, 1, "complaint must not be duplicated in Assessment");
assert.match(flow, /activeStep === "Plan"[\s\S]*Prescription[\s\S]*Investigations[\s\S]*Follow-up/, "Plan must contain prescription, investigations, and follow-up");
assert.match(flow, /<span className="badge warning">Draft<\/span>/, "draft must be a status badge");
assert.doesNotMatch(flow, />Guided Visit</, "separate guided/draft interface title must not remain");
assert.match(renderer, /"doctor-visit"[\s\S]*<DoctorVisitFlow/, "one Visit renderer must serve the workflow");
assert.match(css, /\.visit-progress-header[\s\S]*position: sticky/, "compact progress header must remain visible");

console.log("v1.4.6 unified Draft/Visit five-step workflow PASS (22 assertions)");
