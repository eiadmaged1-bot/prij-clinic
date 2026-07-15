import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [controller, service, owner, shell, css] = await Promise.all([
  readFile("apps/api/src/dashboard/dashboard.controller.ts", "utf8"),
  readFile("apps/api/src/dashboard/dashboard.service.ts", "utf8"),
  readFile("apps/web/app/admin/page.tsx", "utf8"),
  readFile("apps/web/app/mvp-page.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

assert.match(controller, /@Get\("owner-control"\)/);
assert.match(controller, /@RequireRoles\("Owner"\)/);
assert.match(service, /status: "recorded", paidAt: \{ gte: start, lt: tomorrow \}/);
assert.match(service, /safeMetric/);
assert.match(service, /take: 5, orderBy/);
assert.match(service, /select: \{ id: true, action: true, resourceType: true, severity: true, createdAt: true \}/);
assert.doesNotMatch(service, /firstName|lastName|medicalRecordNumber|phone:/);
for (const label of ["Active staff", "Roles", "Active patients", "Today visits", "Active services", "Pending reviews", "Revenue collected today", "System alerts"]) assert.match(owner, new RegExp(label));
for (const destination of ["/admin/accounts", "/admin/services", "/admin/settings", "/admin/audit", "/admin/security-readiness", "/patients/import", "/admin/medications", "/admin/investigations", "/admin/appearance"]) assert.match(owner, new RegExp(destination.replaceAll("/", "\\/")));
assert.match(owner, /Not configured/);
assert.match(owner, /data\.services\.map/);
assert.doesNotMatch(owner, /createService|updateService|demo revenue|fake/i);
assert.match(shell, /document\.body\.style\.overflow = "hidden"/);
assert.match(shell, /event\.key === "Escape"/);
assert.match(shell, /onTouchStart/);
assert.match(shell, /mobile-nav-backdrop/);
assert.match(shell, /LanguageSwitcher/);
assert.match(shell, /onLogout/);
assert.match(css, /width: min\(21\.25rem, 92vw\)/);
assert.match(css, /\.owner-kpi-grid \{ grid-template-columns: repeat\(2/);

console.log("v1.4.8 Owner Control Center and shared shell PASS (40 assertions)");
