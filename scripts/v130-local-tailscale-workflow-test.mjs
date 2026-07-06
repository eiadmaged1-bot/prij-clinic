import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V130-LOCAL-TAILSCALE PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const files = [
  "apps/web/lib/case-library.ts",
  "apps/web/lib/staff-chat.ts",
  "apps/web/lib/doctor-visit.ts"
];

for (const file of files) {
  const source = await readFile(file, "utf8");
  assert(source.includes("getApiBaseUrl()"), `${file} does not use dynamic API base`);
  assert(!source.includes("localhost:3001"), `${file} hardcodes localhost API`);
}
pass("new feature API calls use dynamic API base");

const chatPage = await readFile("apps/web/app/staff-chat/page.tsx", "utf8");
const casePage = await readFile("apps/web/app/doctor/case-library/page.tsx", "utf8");
const css = await readFile("apps/web/app/globals.css", "utf8");
const devScript = await readFile("scripts/dev.mjs", "utf8");
const cors = await readFile("apps/api/src/config/cors-origins.ts", "utf8");

assert(css.includes("@media (max-width: 900px)") && css.includes("staff-chat-layout") && css.includes("case-library-filter-grid"), "responsive guards missing");
pass("chat and case library have responsive guards");
assert(chatPage.includes("AppShell") && casePage.includes("AppShell"), "new pages do not use shared shell");
pass("logout and language controls remain visible through shared shell");
assert(devScript.includes("0.0.0.0") || devScript.includes("--lan") || devScript.includes("--tailscale"), "dev workflow does not expose LAN/Tailscale binding");
pass("dev workflow keeps LAN/Tailscale binding support");
assert(cors.includes("tailscale") || cors.includes("100.") || cors.includes("localhost"), "CORS source does not include local/Tailscale allowances");
pass("CORS source remains local/Tailscale compatible");

console.log(`V130-LOCAL-TAILSCALE SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
