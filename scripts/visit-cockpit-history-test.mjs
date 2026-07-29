import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [cockpit, shared, guidance, controller, classic, cockpitCss, historyCss] = await Promise.all([
  readFile("apps/web/components/clinic/VisitCockpitWorkspace.tsx", "utf8"),
  readFile("apps/web/components/clinic/SharedClinicalHistory.tsx", "utf8"),
  readFile("apps/web/lib/history-guidance.ts", "utf8"),
  readFile("apps/web/components/clinic/SharedEncounterWorkspaceController.tsx", "utf8"),
  readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8"),
  readFile("apps/web/components/clinic/visit-cockpit.module.css", "utf8"),
  readFile("apps/web/components/clinic/shared-clinical-history.module.css", "utf8")
]);

assert(cockpit.includes("<SharedClinicalHistoryEditor controller={controller} />"), "Cockpit History must expose the shared editor");
assert(!cockpit.includes("Classic Workspace remains available for detailed structured entry"), "Cockpit must not redirect detailed History entry to Classic");
assert(classic.includes("<SharedClinicalHistoryEditor compact controller={controller} />"), "Classic and Cockpit must use the same History editor");
assert.equal((classic.match(/useSharedEncounterWorkspaceController\(/g) ?? []).length, 1, "Classic/Cockpit routing must retain one encounter controller");

for (const field of ["chiefComplaint", "historyText", "examinationJson"]) {
  assert(controller.includes(field), `authoritative draft must retain ${field}`);
}
assert(shared.includes("controller.updateDraft") && shared.includes("clinicalHistory"), "structured History must update the authoritative encounter draft");
assert(controller.includes("editVersionRef.current === savedEditVersion"), "autosave must not clear newer edits");
assert(controller.includes("hadUnsavedChanges") && controller.includes("Unsaved encounter changes were preserved"), "resource reload must preserve unsaved edits");
assert(controller.includes('setSaveState("conflict")') && controller.includes("prepareModeSwitch"), "conflict must block unsafe switching");

for (const context of ["general", "gynecology", "pregnancy", "fertility", "postmenopausal", "postoperative"]) {
  assert(guidance.includes(`${context}:`), `guidance registry must include ${context}`);
}
assert(guidance.includes("recordedSectionIds") && guidance.includes("aRecorded"), "recorded sections must remain visible when context changes");
assert(shared.includes("onClick={() => addConcern") && !guidance.includes("status: \"denied\""), "guidance must require clinician action and never auto-document negatives");
for (const state of ["none", "denied", "unknown", "not_assessed"]) {
  assert(shared.includes(`"${state}"`), `${state} must remain an explicit distinct state`);
}

assert(shared.includes("addConcern") && shared.includes("removeConcern") && shared.includes("Undo last structured change"), "add/remove/undo interactions must exist");
assert(shared.includes('role="group"') && shared.includes("aria-pressed"), "structured choices must expose grouped selected state");
assert(historyCss.includes(":focus-visible") && historyCss.includes("min-height: 44px"), "History controls must have visible focus and practical touch targets");
assert(shared.includes('onKeyDown={(event) => { if (event.key === "Enter")'), "additional concern entry must be keyboard operable");

assert(cockpit.includes("This resource did not fully load") && cockpit.includes("Available rows are shown"), "partial resource failure must not appear empty");
assert(shared.includes("Longitudinal History failed to load"), "History resource failure must not appear empty");
assert(cockpit.includes("openContextRow") && cockpit.includes('window.open(href, "_blank"'), "longitudinal rows must open a safe resource route");
assert(cockpit.includes("contextCollapsed") && cockpitCss.includes(".contextCollapsed"), "collapsing context must widen the editor");

assert(shared.includes("HistoryReadOnlyView") && shared.includes("No editing controls are available"), "signed History must render as clinical read-only content");
assert(cockpit.includes("structuredHistory.map") && cockpit.includes("openHistorySection"), "Review must summarize structured History and link back to a section");
assert(cockpit.includes("openReviewIssue") && cockpit.includes("history-section-obstetric-reproductive"), "History readiness issues must return to the relevant group");
assert(shared.includes("legacyItems(root)") && shared.includes("controller.draft.historyText"), "legacy narrative and older structured arrays must remain readable");

assert(guidance.includes("التاريخ الحيضي والنسائي") && shared.includes("التاريخ المرضي") && cockpit.includes("مراحل الزيارة"), "modified History scope must provide Arabic labels");
assert(historyCss.includes("@media (max-width: 760px)") && cockpitCss.includes("@media (max-width: 620px)"), "History must retain narrow responsive behavior");
assert(cockpit.includes('dir={rtl ? "rtl" : "ltr"}'), "Cockpit must preserve explicit RTL direction");

assert(shared.includes("Loaded longitudinal record") && shared.includes("Pregnancy context") && shared.includes("Fertility context"), "existing patient and episode context must be reused");
assert(guidance.includes("does not select or recommend a method") && guidance.includes("do not add findings automatically"), "guidance must remain documentation-only");

console.log("Guided Visit Cockpit History contracts PASS");
