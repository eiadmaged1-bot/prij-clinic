import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const offline = read("apps/web/lib/offline-sync.ts");
const health = read("apps/web/components/system/OfflineSyncHealth.tsx");
const copy = read("apps/web/i18n/operations-copy.ts");
const visit = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");
const shell = read("apps/web/app/mvp-page.tsx");
const css = read("apps/web/app/globals.css");

function requireAll(source, label, needles) {
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(label + " missing: " + needle);
  }
}

requireAll(offline, "offline queue", [
  "prij:offline-sync:v1",
  "doctor-visit-draft",
  "expectedUpdatedAt",
  "VISIT_DRAFT_STALE",
  "ENCOUNTER_SIGN_CONFLICT",
  "sanitizeValue",
  "forbiddenPayloadKeys",
  "activeSyncIds",
  'status === "conflict"',
  "navigator.onLine",
  "flushOfflineSync"
]);
if (offline.includes("sessionStorage") || offline.includes("prijClinicToken") || offline.includes("authorization:")) {
  throw new Error("Offline queue must not persist authentication material.");
}

requireAll(health, "global sync health component", [
  "operationsUiCopy",
  "copy.autosaveHealth",
  "copy.pending",
  "copy.conflicts",
  "copy.retryPendingSync",
  "copy.conflictGlobalHelp",
  "data-offline-sync-health"
]);
requireAll(copy, "bilingual sync health copy", [
  'autosaveHealth: "Autosave health"',
  'pending: "Pending"',
  'conflicts: "Conflicts"',
  'retryPendingSync: "Retry pending sync"',
  'conflictGlobalHelp: "A newer server copy exists.',
  'autosaveHealth: "حالة الحفظ التلقائي"',
  'pending: "معلق"',
  'conflicts: "تعارضات"',
  'retryPendingSync: "إعادة محاولة المزامنة"'
]);

requireAll(visit, "visit autosave", [
  "enqueueOfflineVisitDraft",
  "syncOfflineVisitDraft",
  "subscribeOfflineSync",
  "Saved on this device",
  "Sync all local changes before signing this visit",
  "ui.discardReloadServer",
  "data-visit-sync-recovery",
  'saveState !== "synced"'
]);
requireAll(copy, "bilingual visit recovery", [
  'discardReloadServer: "Discard local and reload server"',
  'discardReloadServer: "حذف النسخة المحلية وتحميل نسخة الخادم"',
  'workingOffline: "Working offline"',
  'workingOffline: "العمل دون اتصال"'
]);
requireAll(shell, "shell indicator", ["OfflineSyncHealth", "topbar-account-actions", "receptionist-topbar-actions"]);
requireAll(css, "responsive sync UI", ["Sprint 1 offline sync health", ".offline-sync-popover", ".visit-sync-recovery", "@media (max-width: 720px)"]);
console.log("Sprint 1 bilingual offline autosave, sync queue, conflict recovery, and health indicator PASS");
