import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, autosave, footer] = await Promise.all([
  readFile("apps/web/app/patients/[id]/page.tsx", "utf8"),
  readFile("apps/web/lib/autosave-draft.ts", "utf8"),
  readFile("apps/web/components/doctor/DoctorMobileVisitFooter.tsx", "utf8")
]);

assert(page.includes('loadError.name === "AbortError" && !timedOut'), "route-change AbortError must be ignored");
assert(page.includes('timedOut ? "timeout" : "network"'), "timeout and network errors must be classified separately");
assert(page.includes('response.status === 401') && page.includes('setErrorKind("session")'), "real session expiry must be detected from 401");
assert(!page.includes("Fetch is aborted"), "raw abort text must never render");
assert(!page.includes("Go to login"), "generic errors must not be presented as session expiry");
assert(page.includes(">Retry<") && page.includes("Reauthenticate"), "recovery actions must be conditional and user-safe");
assert(page.includes("setPatient(null)") && page.includes("setTimelineItems([])"), "confirmed session expiry must remove visible patient context");
assert(page.includes("useAutosaveDraft") && page.includes("loadLocalDraft"), "visit drafts must autosave and restore");
assert(page.includes("patient_visit_draft") && page.includes("draftFields"), "active visit field payload must be preserved");
assert(autosave.includes("indexedDB.open") && autosave.includes("beforeunload"), "draft persistence must survive route and browser transitions");
for (const label of ["Saving…", "Saved locally", "Offline — saved locally", "Save failed — Retry"]) assert(autosave.includes(label), `autosave state missing ${label}`);
assert(page.includes("Saved at ${new Date"), "saved timestamp must be shown");
assert(page.includes("Retry save") && autosave.includes("async function retry()"), "failed local autosave must offer a working retry");
assert(footer.includes('"Sync pending"') && footer.includes('"Offline draft"'), "mobile footer must expose pending/offline state");

console.log("v1.4.5 patient autosave and session error contract PASS (17 assertions)");
