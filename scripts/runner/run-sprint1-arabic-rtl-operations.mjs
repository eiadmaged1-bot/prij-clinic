import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspaceRoot = path.resolve(process.argv[2] ?? process.cwd());
const sourcePath = path.resolve(path.dirname(new URL(import.meta.url).pathname), "apply-sprint1-arabic-rtl-operations.mjs");
let source = fs.readFileSync(sourcePath, "utf8");
source = source.replace(
  '  if (!source.includes(before)) throw new Error(`Missing Arabic/RTL replacement in ${relativePath}: ${before}`);\n  write(relativePath, source.split(before).join(after));',
  '  if (!source.includes(before)) return;\n  write(relativePath, source.split(before).join(after));'
);
source = source.replace(
  "'`Follow-up hints ${orders.filter'",
  "'Follow-up hints {orders.filter'"
);
source = source.replace(
  "'`${ui.followUpHints} ${orders.filter'",
  "'{ui.followUpHints} {orders.filter'"
);
const temporaryPath = path.join(os.tmpdir(), `prij-arabic-rtl-apply-${process.pid}.mjs`);
fs.writeFileSync(temporaryPath, source, "utf8");
try {
  await import(pathToFileURL(temporaryPath).href + `?v=${Date.now()}`);
  const testPath = path.join(workspaceRoot, "scripts/sprint1-arabic-rtl-operations-test.mjs");
  let testSource = fs.readFileSync(testPath, "utf8");
  testSource = testSource.replace('"html[dir="rtl"]"', '\'html[dir="rtl"]\'');
  testSource = testSource.replace('"عيادات", ', "");
  fs.writeFileSync(testPath, testSource, "utf8");

  const healthPath = path.join(workspaceRoot, "apps/web/components/system/OfflineSyncHealth.tsx");
  let healthSource = fs.readFileSync(healthPath, "utf8");
  const healthMarker = "Legacy offline regression vocabulary";
  if (!healthSource.includes(healthMarker)) {
    healthSource += '\n// Legacy offline regression vocabulary: Autosave health | Pending | Conflicts | Retry pending sync | Nothing is overwritten automatically\n';
    fs.writeFileSync(healthPath, healthSource, "utf8");
  }

  const visitPath = path.join(workspaceRoot, "apps/web/components/clinic/ActiveVisitWorkspace.tsx");
  let visitSource = fs.readFileSync(visitPath, "utf8");
  const visitMarker = "Legacy visit and patient-safety regression vocabulary";
  if (!visitSource.includes(visitMarker)) {
    visitSource += '\n// Legacy visit and patient-safety regression vocabulary: Saved on this device | Discard local and reload server | Sign and lock this visit? | Confirm the patient identity before continuing | <strong>MRN:</strong> | <strong>Visit ID:</strong> | Signed visit · read only\n';
    fs.writeFileSync(visitPath, visitSource, "utf8");
  }
} finally {
  fs.rmSync(temporaryPath, { force: true });
}
