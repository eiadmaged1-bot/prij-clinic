import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V131-TAILSCALE PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const changedScreens = [
  "apps/web/app/admin/settings/page.tsx",
  "apps/web/app/dashboard/page.tsx",
  "apps/web/app/mvp-page.tsx"
];
for (const file of changedScreens) {
  const source = await readFile(file, "utf8");
  assert(!source.includes("http://localhost"), `${file} introduced hardcoded localhost`);
}
pass("changed screens avoid localhost-only fetches");

const settings = await readFile("apps/web/app/admin/settings/page.tsx", "utf8");
assert(settings.includes("getApiBaseUrl()"), "settings page must use dynamic API base");
pass("new settings screen uses dynamic API base");

const dev = await readFile("scripts/dev.mjs", "utf8");
const cors = await readFile("apps/api/src/config/cors-origins.ts", "utf8");
assert(dev.includes("--tailscale") && dev.includes("0.0.0.0"), "Tailscale dev binding support missing");
assert(cors.includes("CORS_ALLOW_TAILSCALE_DEV") || cors.includes("tailscale"), "CORS Tailscale compatibility missing");
pass("local same-PC and Tailscale source compatibility remains present");

const css = await readFile("apps/web/app/globals.css", "utf8");
assert(css.includes("@media (max-width: 900px)") && css.includes("@media (max-width: 520px)"), "responsive guards missing");
pass("responsive guards exist for compact UI");

console.log(`V131-TAILSCALE SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
