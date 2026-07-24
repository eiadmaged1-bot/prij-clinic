import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const root = process.cwd();
const nativeRequire = createRequire(import.meta.url);

function loadTypeScriptModule(relativePath, resolveRequire = nativeRequire) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      experimentalDecorators: true
    },
    fileName: relativePath
  }).outputText;
  const module = { exports: {} };
  Function("module", "exports", "require", output)(module, module.exports, resolveRequire);
  return module.exports;
}

const shared = loadTypeScriptModule("packages/shared/src/complaint-lifecycle.ts");
const backend = loadTypeScriptModule("apps/api/src/complaints/complaint-lifecycle.ts");
const dtoModule = loadTypeScriptModule("apps/api/src/doctor-visit/dto.ts", (request) => (
  request === "../complaints/complaint-lifecycle" ? backend : nativeRequire(request)
));
const { validateSync } = nativeRequire("class-validator");
const encounterService = fs.readFileSync(path.join(root, "apps/api/src/encounters/encounters.service.ts"), "utf8");
const encounterDto = fs.readFileSync(path.join(root, "apps/api/src/encounters/dto.ts"), "utf8");
const doctorVisitDto = fs.readFileSync(path.join(root, "apps/api/src/doctor-visit/dto.ts"), "utf8");
const editor = fs.readFileSync(path.join(root, "apps/web/components/clinic/ActiveVisitWorkspace.tsx"), "utf8");
const overview = fs.readFileSync(path.join(root, "apps/web/app/patients/[id]/patient-components.tsx"), "utf8");

const expectedStatuses = ["ACTIVE", "IMPROVING", "RESOLVED", "CHRONIC", "REFRACTORY"];
assert.deepEqual(shared.COMPLAINT_LIFECYCLE_STATUSES, expectedStatuses, "shared lifecycle statuses must preserve the four existing values and add REFRACTORY");
assert.deepEqual(Object.values(backend.COMPLAINT_LIFECYCLE_STATUS), expectedStatuses, "backend canonical lifecycle values must match shared values");
for (const status of expectedStatuses) {
  assert.equal(shared.isComplaintLifecycleStatus(status), true, `shared validation must accept ${status}`);
  assert.equal(backend.complaintStatusLabel(status), shared.complaintStatusLabel(status), `${status} labels must agree across layers`);
  const dto = Object.assign(new dtoModule.UpdateDoctorVisitDto(), { complaintStatus: status });
  assert.equal(validateSync(dto).length, 0, `real doctor visit DTO must accept ${status}`);
}
const invalidDto = Object.assign(new dtoModule.UpdateDoctorVisitDto(), { complaintStatus: "HISTORICAL_UNKNOWN" });
assert.ok(validateSync(invalidDto).some((error) => error.property === "complaintStatus"), "real doctor visit DTO must reject unknown new status input");
assert.match(encounterDto, /@IsEnum\(COMPLAINT_LIFECYCLE_STATUS\)[\s\S]*complaintStatus/, "encounter DTO must validate canonical complaint statuses");
assert.match(doctorVisitDto, /@IsEnum\(COMPLAINT_LIFECYCLE_STATUS\)[\s\S]*complaintStatus/, "doctor visit DTO must validate canonical complaint statuses");

const encounterId = "00000000-0000-4000-8000-000000000046";
const recordedAt = new Date("2026-07-24T09:30:00.000Z");
const saved = backend.mergeComplaintLifecycle(
  { existingFollowUpValue: "preserved" },
  backend.COMPLAINT_LIFECYCLE_STATUS.REFRACTORY,
  { encounterId, recordedAt }
);
assert.equal(saved.existingFollowUpValue, "preserved", "complaint save must preserve unrelated encounter JSON");
assert.equal(saved.complaintLifecycle.status, "REFRACTORY", "backend must persist the canonical refractory value");
assert.equal(saved.complaintLifecycle.encounterId, encounterId, "saved complaint must retain encounter provenance");
assert.equal(saved.complaintLifecycle.recordedAt, recordedAt.toISOString(), "saved complaint must retain date provenance");
assert.equal(saved.complaintLifecycle.source, "ENCOUNTER", "saved complaint must retain source provenance");
assert.equal(saved.complaintLifecycle.history.length, 1, "initial save must add one lifecycle history event");

const signedAt = new Date("2026-07-24T10:00:00.000Z");
const signedOnce = backend.mergeComplaintLifecycle(saved, "REFRACTORY", { encounterId, recordedAt, signedAt });
const signedTwice = backend.mergeComplaintLifecycle(signedOnce, "REFRACTORY", { encounterId, recordedAt, signedAt });
assert.equal(signedTwice.complaintLifecycle.status, "REFRACTORY", "refractory must persist through signing");
assert.equal(signedTwice.complaintLifecycle.signedAt, signedAt.toISOString(), "signing provenance must be retained");
assert.equal(signedTwice.complaintLifecycle.history.length, 1, "repeated signing must not duplicate the complaint lifecycle event");
assert.match(encounterService, /existing\.status === "signed"[\s\S]*complaintLifecycleFromJson/, "real sign path must replay an already-signed lifecycle encounter");

const encounters = [
  { id: encounterId, chiefComplaint: "Synthetic focused-test complaint", status: "signed", followUpJson: signedTwice, createdAt: recordedAt },
  {
    id: "00000000-0000-4000-8000-000000000047",
    chiefComplaint: "Synthetic resolved complaint",
    status: "signed",
    followUpJson: backend.mergeComplaintLifecycle(undefined, "RESOLVED", {
      encounterId: "00000000-0000-4000-8000-000000000047",
      recordedAt
    }),
    createdAt: recordedAt
  }
];
const history = backend.longitudinalComplaintsFromEncounters(encounters);
assert.equal(history.length, 2, "longitudinal complaint history must preserve refractory and resolved complaints");
assert.equal(history.find((item) => item.status === "REFRACTORY")?.active, true, "refractory must remain in the active complaint family");
assert.equal(history.find((item) => item.status === "RESOLVED")?.active, false, "refractory behavior must remain distinct from resolved");

assert.equal(shared.complaintStatusLabel("REFRACTORY"), "Refractory", "UI label must render Refractory safely");
assert.equal(shared.complaintStatusLabel("HISTORICAL_UNKNOWN"), "Unknown", "unknown historical values must not crash UI labeling");
assert.equal(shared.isActiveComplaintStatus("REFRACTORY"), true, "shared overview filtering must retain refractory complaints");
assert.equal(shared.isActiveComplaintStatus("RESOLVED"), false, "shared overview filtering must exclude resolved complaints");
assert.match(editor, /complaintStatusLabel\(status\)/, "real complaint editor must use safe shared labels");
assert.match(editor, /complaint-status-badge \$\{form\.complaintStatus === "REFRACTORY"/, "real complaint editor must render the refractory badge");
assert.match(overview, /complaintHistory\.filter\(\(row\) => row\.active === true\)/, "real Patient Overview must filter by active-family behavior");
assert.match(overview, /<h2>Complaint history<\/h2>/, "real Patient Overview must render longitudinal complaint history");

console.log("Feature 46 refractory complaint focused checks passed (no database used).");
