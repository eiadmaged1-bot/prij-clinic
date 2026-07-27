import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const target = path.join(root, "scripts/sprint1-offline-sync-health-test.mjs");
let source = fs.readFileSync(target, "utf8");

const healthBefore = 'requireAll(health, "global sync health", ["Autosave health", "Pending", "Conflicts", "Retry pending sync", "Nothing is overwritten automatically", "data-offline-sync-health"]);';
const healthAfter = 'requireAll(health, "global sync health", ["copy.autosaveHealth", "copy.pending", "copy.conflicts", "copy.retryPendingSync", "copy.conflictGlobalHelp", "data-offline-sync-health"]);';
if (!source.includes(healthBefore)) throw new Error("Offline health regression contract changed unexpectedly.");
source = source.replace(healthBefore, healthAfter);

source = source.replace('  "Saved on this device",', '  "ui.queuedVisitHelp",');
source = source.replace('  "Discard local and reload server",', '  "ui.discardReloadServer",');

fs.writeFileSync(target, source, "utf8");
console.log("Offline Sync Health regression updated for localized operational copy.");
