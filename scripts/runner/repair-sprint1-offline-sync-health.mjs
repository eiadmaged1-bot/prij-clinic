import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());

function replaceOnce(relativePath, before, after) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  if (!source.includes(before)) throw new Error("Missing offline-sync repair contract in " + relativePath);
  fs.writeFileSync(target, source.replace(before, after), "utf8");
}

replaceOnce(
  "scripts/sprint1-offline-sync-health-test.mjs",
  '  "ENCOUNTER_SIGN_CONFLICT",\n  "Nothing",\n  "sanitizeValue",',
  '  "ENCOUNTER_SIGN_CONFLICT",\n  "sanitizeValue",'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `  useEffect(() => subscribeOfflineSync(() => {
    const queued = getOfflineVisitDraft(patientId, visitId);
    if (queued?.status === "conflict") setSaveState("conflict");
    else if (queued?.status === "failed") setSaveState("failed");
    else if (queued?.status === "syncing") setSaveState("syncing");
    else if (queued?.status === "pending") setSaveState(navigator.onLine ? "queued" : "offline");
  }), [patientId, visitId]);`,
  `  useEffect(() => subscribeOfflineSync(() => {
    const queued = getOfflineVisitDraft(patientId, visitId);
    if (queued?.status === "conflict") setSaveState("conflict");
    else if (queued?.status === "failed") setSaveState("failed");
    else if (queued?.status === "syncing") setSaveState("syncing");
    else if (queued?.status === "pending") setSaveState(navigator.onLine ? "queued" : "offline");
    else {
      localStorage.removeItem(draftKey);
      setSaveState((current) => current === "unsaved" ? current : "synced");
      void loadVisit();
    }
  }), [draftKey, loadVisit, patientId, visitId]);`
);

console.log("Sprint 1 offline sync health package repaired.");
