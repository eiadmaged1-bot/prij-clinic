import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [visit, page, service, controller, schema] = await Promise.all([
  read("apps/web/components/clinic/ActiveVisitWorkspace.tsx"),
  read("apps/web/app/investigations/page.tsx"),
  read("apps/api/src/investigations/investigations.service.ts"),
  read("apps/api/src/investigations/investigations.controller.ts"),
  read("apps/api/prisma/schema.prisma")
]);

assert.match(visit, /Open connected investigation ordering/);
assert.match(visit, /\/investigations\?patientId=/);
assert.doesNotMatch(visit, /function InvestigationsModule[\s\S]{0,800}Attach to locked visit/);
assert.match(page, /investigations\/order-draft/);
assert.match(page, /sessionStorage\.setItem\(basketStorageKey/);
assert.match(page, /Duplicate active order warning/);
assert.match(page, /Applying a set never orders automatically/);
assert.match(page, /Results follow-up/);
assert.match(page, /Catalog administration/);
assert.match(page, /Patient informed/);
assert.match(page, /Showing \{requestPageInfo/);
assert.match(service, /allowedInvestigationTransitions/);
assert.match(service, /assertLifecycleRole/);
assert.match(service, /investigation_order\.status_updated/);
assert.match(service, /skip: \(page - 1\) \* limit/);
assert.match(controller, /@Query\("status"\)/);
for (const field of ["responsibilityJson", "lifecycleHistoryJson", "expectedResultDate", "templateVersion"]) assert.ok(schema.includes(field));

console.log("v1.5.1 connected investigation route and lifecycle contracts passed");
