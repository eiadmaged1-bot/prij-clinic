import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");
const [owner, services, investigations, auditPage, auditService, adminController, accountsService, appearance, security, css, en, ar] = await Promise.all([
  read("apps/web/app/admin/page.tsx"), read("apps/web/app/admin/services/page.tsx"), read("apps/web/app/admin/investigations/page.tsx"), read("apps/web/app/admin/audit/page.tsx"), read("apps/api/src/audit/audit.service.ts"), read("apps/api/src/rbac/admin.controller.ts"), read("apps/api/src/rbac/rbac.service.ts"), read("apps/web/app/admin/appearance/page.tsx"), read("apps/web/app/admin/security-readiness/page.tsx"), read("apps/web/app/globals.css"), read("apps/web/i18n/en.ts"), read("apps/web/i18n/ar.ts")
]);

for (const destination of ["/admin/accounts", "/admin/services", "/admin/audit", "/admin/security-readiness", "/patients/import", "/admin/investigations", "/admin/appearance"]) assert.match(owner, new RegExp(destination.replaceAll("/", "\\/")));
assert.match(owner, /dashboard\/owner-control/);
assert.doesNotMatch(services, /AdminPage/);
for (const token of ['t("servicesPricing")', 't("newService")', "data-table", "pagination-row", "admin-editor-drawer", "Deactivate", "Restore"]) assert.match(services, new RegExp(token.replace(/[()]/g, "\\$&")));
for (const token of ['t("investigationCatalog")', "data-table", "pagination-row", "admin-editor-drawer", "Clinical group"]) assert.match(investigations, new RegExp(token.replace(/[()]/g, "\\$&")));
for (const dictionary of [en, ar]) for (const key of ["servicesPricing", "newService", "investigationCatalog"]) assert.match(dictionary, new RegExp(`${key}:\\s*\"[^\"]+\"`));
assert.match(adminController, /@Get\("audit"\)/);
assert.match(auditService, /listPage/);
assert.match(auditService, /skip: \(page - 1\) \* pageSize/);
for (const token of ["URLSearchParams", 'pageSize: "25"', "Severity", "Resource", "Page \{data.page\}"]) assert.match(auditPage, new RegExp(token));
assert.match(accountsService, /defaultTheme: "prij-heritage"/);
assert.match(accountsService, /sanitizeAppearanceConfig/);
assert.match(accountsService, /sanitizeRoleDefaults/);
assert.match(accountsService, /locked && accountHasRole\(existing, "Owner"\)/);
assert.match(accountsService, /The final active Owner cannot be deactivated or assigned another role/);
for (const preview of ["Reception", "Doctor patient file", "Investigations", "Ultrasound", "Knowledge Center", "معاينة العربية", "desktop / tablet / mobile"]) assert.match(appearance, new RegExp(preview));
for (const column of ["automatedManual", "evidence", "owner", "lastChecked", "blocker", "action"]) assert.match(security, new RegExp(`t\\("${column}"\\)`));
assert.match(css, /admin-editor-backdrop/);

console.log("v1.5.1 Owner dashboard, admin tables, account governance, Appearance, and readiness contracts PASS");
