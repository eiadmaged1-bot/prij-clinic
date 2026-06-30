import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const theme = await readFile("apps/web/app/theme.tsx", "utf8");
const layout = await readFile("apps/web/app/layout.tsx", "utf8");
const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
const navManifest = await readFile("apps/web/lib/navigation-manifest.ts", "utf8");
const patientManifest = await readFile("apps/web/lib/patient-tabs-manifest.ts", "utf8");
const css = await readFile("apps/web/app/globals.css", "utf8");

for (const token of ["data-theme", "data-density", "data-scale", "data-motion"]) {
  assert(layout.includes(token) || css.includes(token), `${token} is missing`);
}

for (const token of ["DensityMode", "ScaleMode", "MotionMode", "setDensity", "setScale", "setMotion"]) {
  assert(theme.includes(token), `theme provider missing ${token}`);
}

assert(shell.includes("navigationGroups") && shell.includes("adminNavigationGroup"), "AppShell is not wired to navigation manifest");
assert(!shell.includes("portalSideItems") && !shell.includes("portal-side-nav"), "theme-specific shell navigation is still present");
assert(patientManifest.includes("Pregnancy/OB") && patientManifest.includes("Billing/Finance"), "patient tab manifest is incomplete");

for (const label of ["Dashboard", "Patients", "Guided Visit", "Evidence Library", "Reference Data", "Accounts"]) {
  assert(navManifest.includes(label), `navigation manifest missing ${label}`);
}

for (const axis of ['data-density="compact"', 'data-scale="magnified"', 'data-motion="reduced"']) {
  assert(css.includes(axis), `CSS missing ${axis}`);
}

console.log("THEME-MATRIX PASS");
