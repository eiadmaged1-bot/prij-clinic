import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const offline = read("apps/web/lib/offline-sync.ts");
const health = read("apps/web/components/system/OfflineSyncHealth.tsx");
const visit = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");
const shell = read("apps/web/app/mvp-page.tsx");
const css = read("apps/web/app/globals.css");

const requireAll = (source, label, needles) => {
  for (const needle of needles) if (!source.includes(needle)) throw new Error(label + " missing: " + needle);
};

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
if (offline.includes("sessionStorage") || offline.includes("prijClinicToken") || offline.includes("authorization:")) throw new Error("Offline queue must not persist authentication material.");
requireAll(health, "global sync health", ["Autosave health", "Pending", "Conflicts", "Retry pending sync", "Nothing is overwritten automatically", "data-offline-sync-health"]);
requireAll(visit, "visit autosave", [
  "enqueueOfflineVisitDraft",
  "syncOfflineVisitDraft",
  "subscribeOfflineSync",
  "Saved on this device",
  "Sync all local changes before signing this visit",
  "Discard local and reload server",
  "data-visit-sync-recovery",
  'saveState !== "synced"'
]);
requireAll(shell, "shell indicator", ["OfflineSyncHealth", "topbar-account-actions", "receptionist-topbar-actions"]);
requireAll(css, "responsive sync UI", ["Sprint 1 offline sync health", ".offline-sync-popover", ".visit-sync-recovery", "@media (max-width: 720px)"]);
console.log("Sprint 1 offline autosave, sync queue, conflict recovery, and health indicator PASS");
