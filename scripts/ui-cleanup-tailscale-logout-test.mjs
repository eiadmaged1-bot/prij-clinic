import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shell = readFileSync("apps/web/app/mvp-page.tsx", "utf8");
const css = readFileSync("apps/web/app/globals.css", "utf8");
const patients = readFileSync("apps/web/app/patients/page.tsx", "utf8");
const checkIn = readFileSync("apps/web/app/reception/check-in/page.tsx", "utf8");
const newPatient = readFileSync("apps/web/app/patients/new/page.tsx", "utf8");
const apiBase = readFileSync("apps/web/lib/api-base-url.ts", "utf8");
const cors = readFileSync("apps/api/src/config/cors-origins.ts", "utf8");
const dev = readFileSync("scripts/dev.mjs", "utf8");
const pkg = readFileSync("package.json", "utf8");

assert(shell.includes("function AccountMenu"), "universal account menu exists in shared shell");
assert(shell.includes("account-logout-button") && shell.includes("Logout"), "logout button is present in account menu");
assert(shell.includes("user?.displayName || user?.loginId || user?.email"), "account menu has display name/login fallback");
assert(shell.includes("primaryRole(user.roles)") && shell.includes("<span className=\"badge\">{role}</span>"), "role badge appears in account menu");
assert(css.includes(".account-menu") && css.includes("@media (max-width: 1199px)"), "account menu has responsive topbar styling");
assert(!/\.topbar > \.account-menu\s*\{\s*display:\s*none/i.test(css), "account menu is not hidden at mobile widths");

assert(apiBase.includes("isTailscaleOrCgnatIpv4") && apiBase.includes("isTailscaleMagicDnsHost"), "browser API base supports Tailscale IP and MagicDNS");
assert(apiBase.includes("NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK") && apiBase.includes("defaultLanApiPort"), "browser API base can derive same-host dev API port");
assert(cors.includes("allowTailscaleDevOrigins") && cors.includes("isTailscaleMagicDnsHost"), "backend CORS supports dev-only Tailscale origins");
assert(dev.includes("--tailscale") && dev.includes("API_HOST") && dev.includes("0.0.0.0"), "dev:tailscale binds API/web for tailnet access");
assert(pkg.includes("\"dev:tailscale\""), "package script dev:tailscale exists");

assert(patients.includes("Training records are hidden") && patients.includes("Show training records"), "patient files empty state explains hidden training data");
assert(patients.includes("New Patient File"), "patient files page keeps new patient action visible");
assert(shell.includes("appointmentRowLabel") && shell.includes("isUuidLike"), "appointment rows avoid raw UUID primary titles");
assert(checkIn.includes("showTrainingRecords") && checkIn.includes("visiblePatients") && checkIn.includes("visibleAppointments"), "check-in hides noisy training data by default");
assert(newPatient.includes("<details") && newPatient.includes("Sensitive details") && newPatient.includes("Unknown / not asked"), "sensitive intake is optional and collapsed by default");

for (const [label, source] of [
  ["shell", shell],
  ["patients", patients],
  ["check-in", checkIn],
  ["new patient", newPatient]
]) {
  assert(!/<pre>|raw JSON|stack trace|schema\.prisma|JWT_SECRET|DATABASE_URL/i.test(source), `${label} normal UI avoids raw technical text`);
}

console.log("PASS UI cleanup, universal logout, and Tailscale source checks");
